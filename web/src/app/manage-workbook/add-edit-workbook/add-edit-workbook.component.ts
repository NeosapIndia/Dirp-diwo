import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { ActivatedRoute, Router } from "@angular/router";
import { ManageAddEditWorkbookService } from "./add-edit-workbook.service";
import { environment } from "../../../environments/environment";
import { AppService } from "../../../app/app.service";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { map, switchMap } from "rxjs";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { DragulaService } from "ng2-dragula";
import { Location } from "@angular/common";
import { ChangeDetectorRef } from "@angular/core";
import { HttpEvent } from "@angular/common/http";
import * as moment from "moment";
import * as JSZip from 'jszip';

declare var $: any;

@Component({
  selector: "app-add-edit-workbook",
  templateUrl: "./add-edit-workbook.component.html",
  styleUrls: ["./add-edit-workbook.component.css"],
  viewProviders: [DragulaService],
})
export class AddEditWorkbookComponent implements OnInit, OnDestroy {
  guideList = [];
  beforeTranscodingFlag: boolean = false;
  notOwnAnyAssetRoleId = [2, 3, 4, 5];
  showAssetTab = 1;
  typeForSearch;
  assetListByGoogleDrive = [];
  assetBasePath = environment.imageHost + environment.imagePath;
  isMultipleSelected = false;
  isUploadProgress = false;
  selectedWorksheetIndex = null;
  selectedWorksheetErrorIndex = null;
  showWorkbookDetails: boolean = true;
  assignedWoorkbookForm: FormGroup;
  worksheetList = [];
  preview;
  previewIndex = 0;
  maxLengthForMinMaxLabel = 24;
  maxLengthForMaxMaxLabel = 24;
  showAssignLearner: boolean = true;
  course_List = [];
  diwoUserNameList = [
    { name: "User 1" },
    { name: "User 2" },
    { name: "User 3" },
  ];
  answerPerParticipant = [
    { no: 1 },
    { no: 2 },
    { no: 3 },
    { no: 4 },
    { no: 5 },
    { no: 6 },
    { no: 7 },
    { no: 8 },
    { no: 9 },
  ];
  changeWorksheet = true;
  quizTypeList = [
    {
      no: 1,
      type: "MCQ",
    },
    {
      no: 2,
      type: "Drag and Drop",
    },
  ];

  timeToShowList = [
    {
      no: 1,
      type: "Upon Submission",
    },
    {
      no: 2,
      type: "Upon Session Closure",
    },
  ];

  survayTypeList = [
    {
      no: 1,
      label: "Short Answer",
      type: "Short answer",
    },
    {
      no: 2,
      label: "Long Answer",
      type: "Long answer",
    },
    {
      no: 3,
      label: "MCQ",
      type: "MCQ",
    },
    {
      no: 4,
      label: "Rating Scale",
      type: "Rating scale",
    },
    {
      no: 5,
      label: "File Upload",
      type: "File upload",
    },
    {
      no: 6,
      label: "Drop Down",
      type: "Drop Down",
    },
    {
      no: 7,
      label: "Date",
      type: "Date",
    },
    {
      no: 8,
      label: "Date Time",
      type: "Date Time",
    },
    {
      no: 9,
      label: "Mobile No",
      type: "Mobile No",
    },
    {
      no: 10,
      label: "Email",
      type: "Email",
    },
    {
      no: 11,
      label: "Geo Tag",
      type: "Geo Tag",
    },
  ];
  //check survey geo tag type selected or not
  survayTypeListWithoutGeoTag = [
    {
      no: 1,
      label: "Short Answer",
      type: "Short answer",
    },
    {
      no: 2,
      label: "Long Answer",
      type: "Long answer",
    },
    {
      no: 3,
      label: "MCQ",
      type: "MCQ",
    },
    {
      no: 4,
      label: "Rating Scale",
      type: "Rating scale",
    },
    {
      no: 5,
      label: "File Upload",
      type: "File upload",
    },
    {
      no: 6,
      label: "Drop Down",
      type: "Drop Down",
    },
    {
      no: 7,
      label: "Date",
      type: "Date",
    },
    {
      no: 8,
      label: "Date Time",
      type: "Date Time",
    },
    {
      no: 9,
      label: "Mobile No",
      type: "Mobile No",
    },
    {
      no: 10,
      label: "Email",
      type: "Email",
    },
  ];

  fileTypes = [
    { label: "PDF", name: "PDF" },
    { label: "Audio", name: "Audio" },
    { label: "Video", name: "Video" },
    { label: "Image", name: "Image" },
  ];
  numberOfFiles = [
    { label: 1, name: 1 },
    { label: 2, name: 2 },
    { label: 3, name: 3 },
    { label: 4, name: 4 },
    { label: 5, name: 5 },
  ];
  fileSize = [
    { label: "1 MB", name: "1 MB" },
    { label: "2 MB", name: "2 MB" },
    { label: "5 MB", name: "5 MB" },
    { label: "10 MB", name: "10 MB" },
  ];

  surveyRatingType = [
    {
      label: "Text",
      name: "Text",
    },
    // {
    //   label: "Box",
    //   name: "Box",
    // },
    // {
    //   label: "Star",
    //   name: "Star",
    // },
    // {
    //   label: "Heart",
    //   name: "Heart",
    // },
    // {
    //   label: "Thumbs Up",
    //   name: "Thumbs-Up",
    // },
  ];

  duplicateworksheetDetail: any;
  optionCountForRatingScale = 5;

  videoComplition = false;
  isQuizCompletion = false;
  maxReAttemptsAllowed = 0;

  worksheetDetail = {
    id: null,
    worksheetUploadProgress: 0,
    description: null,
    showTrainerInstrution: false,
    trainerInst: null,
    type: "Learning Content",
    thumbnailPath: null,
    flgVerify: false,
    flgFav: true,
    flgBookmark: false,
    flgImp: false,
    flgGroupActivty: false,
    chart: "Learning Content",
    DiwoAssets: [],
    isGraded: true,
    publishResult: true,
    anonymous: false,
    trainerSurvey: false,
    trainerSurveyComp: false,
    isMediaSelected: false,
    brief: null,
    briefFiles: [],
    pdfFiles: [],
    sessionFeedback: false,
    sessionFeedBackMinCount: 1,
    sessionFeedBackMaxCount: 5,
    question_Group: false,
    questionGroups: [],
    quizRandCount: 1,
    GuideId: null,
    isquizrandomised: false,
    activityTemplate: "Learning Content",
    charRemainsForactivityTemplate: null,
    noOfTimeSpinWheel: 1,
    noOfQuesForCategory: 0,
    showQueCategory: false,
    spinWheelQueCategory: [],
    isGeoTagSelected: false,
    trainerSurveyDisable: false,
    keepSurveyOn: false,
    keepSurveyOnDays: null,
    mediaWorkSheet: false,
    mediaProfilesData: [],
    isAssessment: false,
    isPdf: false,
    isInteractivePdf: false,
    // isAttachFile: false,
    isShowScore: true,
    timeToShowOption: "Upon Submission",
    videoComplition: false,
    isQuizCompletion: false,
    maxReAttemptsAllowed: 0,
    isGuideWorksheet: false,
    certificateData: {
      maxMark: 0,
      passingMarks: null,
      condition: "",
    },
    Questions: [
      {
        question: null,
        quizUploadProgress: 0,
        DiwoAssets: [],
        questionType: "MCQ",
        SurveyRatingType: "Text",
        userRatingArray: [],
        characterRemainsForMinLable: null,
        characterRemainsForMaxLable: null,
        ratingMinLabel: null,
        ratingMaxLabel: null,
        selectAnswer: false,  
        answerCount: 1,
        isQuestionSelected: false,
        isQuestionTypeSelected: false,
        characterRemainsForQuestion: null,
        characterRemainsForGeoTag: null,
        allowFileTypes: [],
        fileSize: "2 MB",
        numberOfFiles: 1,
        isTextResponse: true,
        isFileSubmission: false,
        multipleOption: false,
        isAnswerSelected: false,
        surveyCharcterLimit: null,
        surveyMinScale: 1,
        surveyMaxScale: 5,
        group_index: null,
        spinCatIndex: null,
        spinQueScore: 0,
        isSpinQueScore: false,
        uploadOnVimeo: false,
        Options: [
          {
            text: null,
            assetPath: null,
            assetName: null,
            assetType: null,
            isCorrectAnswer: false,
            isOptionSelected: false,
            characterRemainsForOption: null,
          },
        ],
      },
    ],
  };

  workbookForm: any;
  learnerGroupList: any[];
  userDetails: any;
  userRoleId: number;
  editWorkbook: any;
  editFlag: boolean = false;
  selectedWSTypeNo: any;
  questionImageURL: string | ArrayBuffer;
  imgQuestionIndex: any;
  imgOptionIndex: any;
  imgIsquestion: any;
  isShowDeleteIcon = false;
  opacity = 0;

  isPreviewWorkbook: boolean = false;
  viewWorkBookUrl: string;
  vimeoDetails: any;
  uploadPercent: number;
  maxLengthForQuestion = 250;
  maxLengthForOption = 250;
  maxLengthForctivityTemplate = 34;
  maxLengthForGeoTag = 25;

  maxLengthForModuleTitle = 72;
  characterRemainsForModuleTitle = null;

  maxLengthForModuleDescription = 430;
  characterRemainsForModuleDescription = null;

  maxlengthForCertificateLine1 = 160;
  maxlengthForCertificateLine2 = 55;
  maxlengthForCertificateLine3 = 160;

  charRemainsForCertificateLine1 = null;
  charRemainsForCertificateLine2 = null;
  charRemainsForCertificateLine3 = null;

  maxlengthForSignatureName1 = 40;
  maxlengthForSignatureName2 = 40;

  maxlengthForSignatureDesignation1 = 40;
  maxlengthForSignatureDesignation2 = 40;

  charRemainsForSignatureName1 = null;
  charRemainsForSignatureName2 = null;

  charRemainsForSignatureDesignation1 = null;
  charRemainsForSignatureDesignation2 = null;

  uploadDataToConvertImage: any;
  value: undefined;
  updatedWorkbookname: any;
  scrollList: HTMLElement | any;

  MANY_ITEMS = "MANY_ITEMS";
  isviewMode: boolean = false;
  sessionFeedbackSurveyIndex: number;
  selectedClientId: any;
  clientList: any[];
  selectedClient: any;
  ownerClient: { name: any; client_id: any };
  checkVideoTranscodingInterval: any;
  checkVideoTranscodingIntervalForQuestion: any;

  checkMediaCMSVideoTranscodingInterval: any;
  checkMediaCMSVideoTranscodingIntervalForQuestion: any;

  googleDriveAssetSelectedFor: any;
  worksheetBiggerPreviewImg: any;
  isPreviewAvailable: boolean = false;
  excelWorksheetUpload: any;
  isBulkuploadStarted: boolean = false;
  worksheetUploadErrorArray = [];
  maxLengthForCatQue = 15;
  isZeroSpinQuesCategory: boolean = false;
  spinCatCountGreaterThanWheelCount: boolean = false;
  noOfTimeSpinWheelError: boolean = false;
  addMinTwoSpinCategory: boolean = false;
  allMediaProfile = [
    {
      id: 1,
      label: "Facebook",
      value: "facebook",
    },
    {
      id: 2,
      label: "YouTube",
      value: "youtube",
    },

    {
      id: 3,
      label: "Instagram",
      value: "instagram",
    },
    {
      id: 4,
      label: "WhatsApp",
      value: "whatsapp",
    },
    {
      id: 5,
      label: "TikTok",
      value: "tiktok",
    },
    {
      id: 6,
      label: "Reddit",
      value: "reddit",
    },
    {
      id: 7,
      label: "LinkedIn",
      value: "linkedin",
    },
    {
      id: 8,
      label: "Medium",
      value: "medium",
    },
    {
      id: 9,
      label: "telegram",
      value: "telegram",
    },
    {
      id: 10,
      label: "X",
      value: "x",
    },
    {
      id: 11,
      label: "Thread",
      value: "thread",
    },
  ];
  appBranding: any;

  iconObject = {
    delete_icon_primary_24: null,
    delete_icon_primary_27_30: null,
    logout_icon: null,
    "spin-the-wheel-selected": null,
    offline_selected_task_icon: null,
    survey_selected_icon: null,
    word_cloud_selected_icon_: null,

    content_copy: null,
    add_icon_30: null,
    workbook_setup_icon: null,
    learning_content_selected_icon_: null,
    "group-discussion_selected": null,
    quiz_selected_icon_: null,
    poll_selected_icon_: null,
    download_fill: null,
    info_icon_25: null,
    back_arrow_icon: null,
    search_loader_preview: null,

    modeule_ILT: null,
    modeule_VBT: null,
    module_webBased: null,
    module_assignment: null,
    arrow_icon_rotate: null,
    arrow_icon: null,
  };

  //MOdules
  allModuleList = [];
  showModuleTypeSelection = false;
  selectedModuleType: number;

  //Certificate
  showAddCerticiatePage: boolean = false;
  stepCount: number = 1;
  showAddCertiifcateButton: boolean = false;
  assessmentWorksheetList = [];
  stepsBar = [1, 2];
  types = [
    {
      title:
        "Learner must pass all assessments to receive the certificate/Badge",
      name: "AND",
    },
    {
      title:
        "Learner can pass any one assessment to receive the certificate/Badge",
      name: "OR",
    },
  ];
  badgesList = [];
  certificateList = [];
  worksheet_thumbnail: any;
  workbook_thumbnail: any;
  showSignatureAuthority2: boolean = false;
  signatureAuthorityIndex = 1;
  today = new Date();
  checkPreviousQuestionsTrancoding: boolean = false;
  checkPreviousWorksheetTrancoding: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    public appService: AppService,
    private workbookService: ManageAddEditWorkbookService,
    private router: Router,
    public sanitizer: DomSanitizer,
    public dragulaService: DragulaService,
    private location: Location
  ) {
    localStorage.setItem("isRedirectAllowed", "false");
    if (JSON.parse(localStorage.getItem("app_branding"))) {
      this.appBranding = JSON.parse(localStorage.getItem("app_branding"));
    }
    let clientDetails = JSON.parse(localStorage.getItem("client"));
    this.videoComplition = clientDetails?.videoComplition
      ? clientDetails.videoComplition
      : false;

    this.isQuizCompletion = clientDetails?.isQuizCompletion
      ? clientDetails.isQuizCompletion
      : false;
    this.maxReAttemptsAllowed = clientDetails?.maxReAttemptsAllowed
      ? clientDetails.maxReAttemptsAllowed
      : 0;

    this.selectedClientId = clientDetails?.id ? clientDetails.id : null;

    this.worksheetDetail.videoComplition = this.videoComplition;
    this.worksheetDetail.isQuizCompletion = this.isQuizCompletion;
    this.worksheetDetail.maxReAttemptsAllowed = this.maxReAttemptsAllowed;
  }

  ngOnInit() {
    this.createWorkbookForm();
    this.createassignedWoorkbookForm();

    // this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;
    this.userDetails = JSON.parse(localStorage.getItem("user")).user || null;
    this.userRoleId = parseInt(localStorage.getItem("roleId"));

    this.editWorkbook = this.route.params["_value"];
    if (this.editWorkbook && this.editWorkbook.moduleId) {
      this.getWorkbookById(parseInt(this.editWorkbook.moduleId));
      this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${this.editWorkbook.moduleId}`;
    } else if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
      this.workbookService
        .getAllClientAndBranchAccountList(this.selectedClientId)
        .subscribe((res: any) => {
          if (res.success) {
            this.selectedClientId = null;
            this.clientList = [];
            this.clientList = res.data;
            this.selectedClient = this.selectedClientId;
            $("#selecteClientList").modal("show");
          }
        });
    } else {
      this.addOneQuestionGroup();
      this.addOneSpinQuestionCategory();
      this.showModuleSelectionPopUp();
    }

    let temp = this.worksheetDetail;
    this.worksheetList.push(temp);
    this.getvimeoToken();
    this.getCourseList();
    this.dragulaService
      .dropModel(this.MANY_ITEMS)
      .subscribe(({ el, target, source, sourceModel, targetModel, item }) => {
        this.worksheetDetail = targetModel[this.selectedWorksheetIndex];
        this.changeWorksheet = true;
      });
    this.getAppBranding();
    this.getModulesList();
    if (
      this.appService.configurable_feature?.sles == true &&
      this.appService.configurable_feature?.arvr == true
    ) {
      this.getGuideList();
    }
  }

  ngOnDestroy(): void {
    if (this.checkVideoTranscodingInterval) {
      clearInterval(this.checkVideoTranscodingInterval);
    }

    if (this.checkVideoTranscodingIntervalForQuestion) {
      clearInterval(this.checkVideoTranscodingIntervalForQuestion);
    }

    if (this.checkMediaCMSVideoTranscodingInterval) {
      clearInterval(this.checkMediaCMSVideoTranscodingInterval);
    }

    if (this.checkMediaCMSVideoTranscodingIntervalForQuestion) {
      clearInterval(this.checkMediaCMSVideoTranscodingIntervalForQuestion);
    }
  }

  getAppBranding() {
    this.appService.setIconWhiteBranding(this.iconObject);
  }

  @HostListener("window:popstate", ["$event"])
  onPopState(event) {
    this.showWorksheetLeavePopUp();
  }

  addOneQuestionGroup() {
    this.worksheetDetail.questionGroups = [
      ...this.worksheetDetail.questionGroups,
      {
        index: 0,
        group_name: null,
      },
    ];
    this.increaseCountForQuestionGroup();
  }

  removeQuestionGroup(index) {
    this.worksheetDetail.questionGroups.splice(index, 1);
    this.worksheetDetail.questionGroups = [
      ...this.worksheetDetail.questionGroups,
    ];
    this.increaseCountForQuestionGroup();
  }

  increaseCountForQuestionGroup() {
    let count = 0;
    if (this.worksheetDetail.questionGroups.length > 1) {
      for (let item of this.worksheetDetail.questionGroups) {
        count++;
        item.index = count;
      }
    }
  }

  selectServeyQuestionGroup(data, index) {}

  onEnterServeyQuestion() {
    this.worksheetDetail.questionGroups = [
      ...this.worksheetDetail.questionGroups,
    ];
  }

  addOneSpinQuestionCategory(comingFrom?) {
    this.worksheetDetail.spinWheelQueCategory = [
      ...this.worksheetDetail.spinWheelQueCategory,
      {
        category_index: 1,
        category_name: null,
        totalquestion: 0,
        totalscore: 0,
        characterRemain: 0,
      },
    ];
    this.increaseCountForSpinQuestionCategry();
    this.addMinTwoSpinCategory = false;
    this.spinCatCountGreaterThanWheelCount = false;
    if (this.worksheetDetail.noOfQuesForCategory <= 0 && comingFrom == "HTML") {
      this.isZeroSpinQuesCategory = true;
    }
  }

  removeSpinQuestionCategory(index) {
    this.worksheetDetail.spinWheelQueCategory.splice(index, 1);
    this.worksheetDetail.spinWheelQueCategory = [
      ...this.worksheetDetail.spinWheelQueCategory,
    ];
    this.increaseCountForSpinQuestionCategry();
  }

  increaseCountForSpinQuestionCategry() {
    let count = 0;
    if (this.worksheetDetail.spinWheelQueCategory.length > 1) {
      for (let item of this.worksheetDetail.spinWheelQueCategory) {
        count++;
        item.category_index = count;
      }
    }
  }

  selectSpinWheeelQuestionCat() {
    if (this.worksheetDetail.spinWheelQueCategory.length > 0) {
      for (let item of this.worksheetDetail.spinWheelQueCategory) {
        item.totalscore = 0;
        item.totalquestion = 0;
        for (let que of this.worksheetDetail.Questions) {
          if (que.spinCatIndex == item.category_index) {
            item.totalscore = item.totalscore + Number(que.spinQueScore);
            item.totalquestion = item.totalquestion + 1;
          }

          // if (item.totalquestion >= this.worksheetDetail.noOfQuesForCategory) {
          // 	item.disable = true;
          // } else {
          // 	item.disable = false;
          // }
        }
      }
    }

    for (let ws of this.worksheetList) {
      if (ws.spinWheelQueCategory && ws.spinWheelQueCategory.length > 0) {
        ws.spinWheelQueCategory = ws.spinWheelQueCategory.map((item) => ({
          ...item,
          disabled: item.totalquestion >= ws.noOfQuesForCategory ? true : false,
        }));
      }
    }
  }

  openSpinWheeelQuestionCat() {
    if (
      this.worksheetDetail.spinWheelQueCategory &&
      this.worksheetDetail.spinWheelQueCategory.length < 2
    ) {
      this.addMinTwoSpinCategory = true;
    }

    if (
      this.worksheetDetail.noOfTimeSpinWheel + 2 >
      this.worksheetDetail.spinWheelQueCategory.length
    ) {
      this.spinCatCountGreaterThanWheelCount = true;
    }
  }

  onEnterSpinTheWheelQuestion(catIndex) {
    this.worksheetDetail.spinWheelQueCategory = [
      ...this.worksheetDetail.spinWheelQueCategory,
    ];
    this.charcterRemainForQueCategory(catIndex);
    if (this.worksheetDetail.noOfQuesForCategory <= 0) {
      this.isZeroSpinQuesCategory = true;
    }
  }

  charcterRemainForQueCategory(catIndex) {
    if (catIndex != null) {
      this.worksheetDetail.spinWheelQueCategory[catIndex].characterRemain =
        this.worksheetDetail.spinWheelQueCategory[catIndex] &&
        this.worksheetDetail.spinWheelQueCategory[catIndex].category_name
          ? this.maxLengthForCatQue -
            Number(
              this.worksheetDetail.spinWheelQueCategory[catIndex].category_name
                .length
            )
          : this.maxLengthForCatQue;
    }
  }

  checknoOfQuesForCategoryCount() {
    this.isZeroSpinQuesCategory = false;
    if (this.worksheetDetail.noOfQuesForCategory > 0) {
      this.worksheetDetail.showQueCategory = true;
    } else {
      this.worksheetDetail.showQueCategory = false;
    }

    if (
      this.worksheetDetail.spinWheelQueCategory &&
      this.worksheetDetail.spinWheelQueCategory.length > 0
    ) {
      this.worksheetDetail.spinWheelQueCategory =
        this.worksheetDetail.spinWheelQueCategory.map((item) => ({
          ...item,
          disabled:
            item.totalquestion >= this.worksheetDetail.noOfQuesForCategory,
        }));
    }
  }

  checknoOfTimeSpinWheelCount() {
    this.noOfTimeSpinWheelError = false;
  }

  getCourseList() {
    this.workbookService
      .getCourseList(this.selectedClientId)
      .subscribe((res: any) => {
        if (res.success) {
          this.course_List = [];
          let payload = {
            id: 0,
            title: "Create New Course",
          };
          this.course_List.push(payload);

          this.course_List = this.course_List.concat(res.data);
        }
      });
  }

  changeStyle($event) {
    this.opacity = $event.type == "mouseover" ? 1 : 0;
  }

  showDeleteOnWS(wsIndex, isShowdeleteIcon) {
    this.worksheetList[wsIndex].isShowDeleteIcon = isShowdeleteIcon;
  }

  deleteWs(wsIndex) {
    if (!this.isviewMode) {
      let selectedWSIndex = this.selectedWorksheetIndex;
      if (this.worksheetList.length > 1) {
        if (this.worksheetList[wsIndex].type == "Follow Us") {
          this.workbookForm.controls["isMediaWorksheet"].setValue(false);
        }
        this.worksheetList.splice(wsIndex, 1);
        if (wsIndex == selectedWSIndex) {
          this.changePreview(wsIndex - 1);
        } else {
          this.changePreview(selectedWSIndex - 1);
        }
      } else {
        this.toastr.warning(
          this.appService.getTranslation(
            "Pages.Workbook.AddEdit.Toaster.atleastoneworksheet"
          ),
          this.appService.getTranslation("Utils.warning")
        );
      }
    }
  }

  createassignedWoorkbookForm() {
    this.assignedWoorkbookForm = this.formBuilder.group({
      assignToLearner: [null],
      assignToTrainer: [null],
    });
  }
  get f1() {
    return this.assignedWoorkbookForm.controls;
  }

  assigedPopup() {
    $("#assigneWorkbookModel").modal("show");
  }

  cancelAssignPopUp() {
    $("#assigneWorkbookModel").modal("hide");
  }

  createWorkbookForm() {
    this.workbookForm = this.formBuilder.group({
      id: null,
      title: ["", [Validators.required]],
      descrip: [""],
      status: ["Publish", [Validators.required]],
      DiwoAssets: [null, [Validators.required]],
      allowWithoutPreAssign: [false],
      allowNewLearner: [false],
      newRegProvisional: [false],
      CourseId: [null],
      CourseName: [null],
      geoTag: [false],
      isMediaWorksheet: [false],
      condition: ["AND"],
      isAppliedBadge: [false],
      isAppliedCertificate: [false],
      haveCertificate: [false],
      BadgeId: [null],
      // CertificateId: [1],
      CertificateLine1: [null],
      CertificateLine2: [null],
      CertificateLine3: [null],
      e_duration: [null],
      l_outcomes: [null],
      isAllowedPDF: [false],
      isInteractivePdf: [false],

      isAddSignature: [false],

      signatureName1: [null],
      signatureDesignation1: [null],
      signaturePath1: [null],
      signaturePathName1: [null],

      signatureName2: [null],
      signatureDesignation2: [null],
      signaturePath2: [null],
      signaturePathName2: [null],
    });
  }

  get wbform() {
    return this.workbookForm.controls;
  }

  // OnchangeCourse(item) {
  // 	if (item.id == 0) {
  // 		this.workbookForm.controls['CourseId'].setValue(null);
  // 		this.workbookForm.controls['CourseName'].setValue(null);
  // 		$('#addNewCourseName').modal('show');
  // 	} else {
  // 		this.workbookForm.controls['CourseId'].setValue(item.id);
  // 		this.workbookForm.controls['CourseName'].setValue(item.title);
  // 	}
  // }

  // cancelCourseNewPopUp() {
  // 	$('#addNewCourseName').modal('hide');
  // }

  // addCourse() {
  // 	if (this.workbookForm.controls['CourseName'].value != null && this.workbookForm.controls['CourseName'] != '') {
  // 		let payload = {
  // 			title: this.workbookForm.controls['CourseName'].value,
  // 		};
  // 		this.workbookService.createCourse(this.selectedClientId, payload).subscribe((res: any) => {
  // 			this.workbookForm.controls['CourseId'].setValue(res.data.id);
  // 			this.getCourseList();
  // 		});
  // 		$('#addNewCourseName').modal('hide');
  // 	}
  // }

  showWorkbookDetail(flag) {
    if (flag) {
      let status = this.checkWorksheet("showWorkbookdetail");
      if (status) {
        this.showWorkbookDetails = true;
      } else {
        this.toastr.warning(
          this.appService.getTranslation(
            "Pages.Workbook.AddEdit.Toaster.allrequiredfield"
          ),
          this.appService.getTranslation("Utils.warning")
        );
      }
    } else {
      this.showWorkbookDetails = false;
    }
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

  changePreview(index) {
    if (this.workbookForm.invalid) {
      this.markAsTouched(this.workbookForm);
      this.toastr.warning(
        this.appService.getTranslation(
          "Pages.Workbook.AddEdit.Toaster.allrequiredfield"
        ),
        this.appService.getTranslation("Utils.warning")
      );

      return;
    }
    // let status = this.checkWorksheet();

    let status = true;
    if (status) {
      this.worksheetDetail = null;
      this.changeWorksheet = false;
      this.selectedWorksheetIndex = index;
      this.selectedWorksheetErrorIndex = -1;

      this.showWorkbookDetails = false;
      this.worksheetDetail = this.worksheetList[index];
      // this.worksheetDetail.worksheetUploadProgress = 0; // Reset progress
      this.previewIndex = index;
      this.editFlag = true;
      setTimeout(() => {
        this.changeWorksheet = true;
      }, 50);
    } else {
      this.toastr.warning(
        this.appService.getTranslation(
          "Pages.Workbook.AddEdit.Toaster.allrequiredfield"
        ),
        this.appService.getTranslation("Utils.warning")
      );
    }
  }

  checkWorksheet(comingFrom) {
    let flag = true;

    console.log('Coming in changing the worksheet', this.worksheetList);

    if (this.selectedWorksheetIndex != null) {
      let worksheet = this.worksheetList[this.selectedWorksheetIndex];
      if (worksheet.DiwoAssets.length == 0) {
        worksheet.isMediaSelected = true;
        flag = false;
      }

      if (
        (!worksheet.chart && worksheet.type != "Content") ||
        !worksheet.type
      ) {
        flag = false;
      }

      if (
        worksheet.type == "Follow Us" &&
        this.workbookForm.value.isMediaWorksheet &&
        worksheet.mediaWorkSheet
      ) {
        if (
          worksheet.mediaProfilesData &&
          worksheet.mediaProfilesData.length > 0
        ) {
          for (let item of worksheet.mediaProfilesData) {
            if (item.mediaName == "" || item.mediaName == null) {
              flag = false;
              item.isPlatformError = true;
            }
            if (item.mediaLink == "" || item.mediaLink == null) {
              flag = false;
              item.isPlatformURLError = true;
            }
            if (item.mediaLink.toLowerCase().indexOf("http") != 0) {
              flag = false;
              item.isPlatformURLValidError = true;
            }

            if (item.isDuplicatePlateForm) {
              flag = false;
            }
          }
        }
      }

      if (worksheet.type == "Quiz" || worksheet.type == "Quiz (Randomised)") {
        if (
          worksheet.isShowScore &&
          (worksheet.timeToShowOption == null ||
            worksheet.timeToShowOption == "")
        ) {
          flag = false;
        }
      }

      if (
        worksheet.type == "Quiz" ||
        worksheet.type == "Quiz (Randomised)" ||
        worksheet.type == "Spin The Wheel"
      ) {
        if (worksheet.type == "Spin The Wheel") {
          if (comingFrom != "addQuestion") {
            if (
              worksheet.spinWheelQueCategory &&
              worksheet.spinWheelQueCategory.length > 0
            ) {
              for (let spinCat of worksheet.spinWheelQueCategory) {
                let spinCategory = spinCat;
                if (
                  spinCategory.totalquestion < worksheet.noOfQuesForCategory
                ) {
                  spinCategory.isError = true;
                  spinCategory.remainQuestionToAdd =
                    worksheet.noOfQuesForCategory - spinCategory.totalquestion;
                  this.toastr.error(
                    this.appService.getTranslation(
                      "Pages.Workbook.AddEdit.Toaster.noOfQuestionForEachCat"
                    ),
                    this.appService.getTranslation("Utils.error")
                  );
                  flag = false;
                } else {
                  spinCategory.isError = false;
                  spinCategory.remainQuestionToAdd = 0;
                }
              }
            }

            //check for spin wheel template type
            if (
              worksheet.noOfQuesForCategory == 0 ||
              worksheet.noOfQuesForCategory == "" ||
              worksheet.noOfQuesForCategory == null ||
              worksheet.noOfQuesForCategory == undefined
            ) {
              this.isZeroSpinQuesCategory = true;
              flag = false;
            }

            if (
              worksheet.noOfTimeSpinWheel == 0 ||
              worksheet.noOfTimeSpinWheel == "" ||
              worksheet.noOfTimeSpinWheel == null ||
              worksheet.noOfTimeSpinWheel == undefined
            ) {
              this.noOfTimeSpinWheelError = true;
              flag = false;
            }

            if (
              worksheet.spinWheelQueCategory &&
              worksheet.spinWheelQueCategory.length < 2
            ) {
              this.addMinTwoSpinCategory = true;
              flag = false;
            }

            if (
              worksheet.noOfTimeSpinWheel + 2 >
              worksheet.spinWheelQueCategory.length
            ) {
              this.spinCatCountGreaterThanWheelCount = true;
              flag = false;
            }
          }
        }

        if (worksheet.type == "Quiz (Randomised)") {
          if (
            worksheet.quizRandCount == "" ||
            worksheet.quizRandCount == null ||
            worksheet.quizRandCount == undefined
          ) {
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.randmonQuestionCount"
              ),
              this.appService.getTranslation("Utils.error")
            );
            flag = false;
          }
          if (comingFrom != "addQuestion") {
            if (worksheet.quizRandCount > worksheet.Questions.length) {
              this.toastr.error(
                this.appService.getTranslation(
                  "Pages.Workbook.AddEdit.Toaster.addTotalRandomQuestion"
                ),
                this.appService.getTranslation("Utils.error")
              );
              flag = false;
            }
          }
        }

        for (let question of worksheet.Questions) {
          if (!question.questionType) {
            (question.isQuestionTypeSelected = true), (flag = false);
          }
          if (!question.questionType || !question.question) {
            question.isQuestionSelected = true;
            flag = false;
          }

          if (
            ["Quiz", "Spin The Wheel", "Quiz (Randomised)"].indexOf(
              worksheet.type
            ) != -1 &&
            question.spinQueScore <= 0
          ) {
            question.isSpinQueScore = true;
            flag = false;
          }

          if (question.questionType == "MCQ") {
            if (question.Options.length <= 1) {
              flag = false;
            }
            let answerIsPresent = false;
            let assetIspresent = false;

            for (let option of question.Options) {
              if (!option.text) {
                option.isOptionSelected = true;
                flag = false;
              }
              if (option.isCorrectAnswer) {
                answerIsPresent = true;
              }
              // if (option.assetPath) {
              // 	assetIspresent = true;
              // }
            }

            if (!answerIsPresent) {
              if ((question.isAnswerSelected = true)) {
                flag = false;
              }
            }

            // if (assetIspresent) {
            // 	for (let option of question.Options) {
            // 		if (!option.assetPath || option.assetPath == null) {
            // 			flag = false;
            // 		}
            // 	}
            // }
          } else if (question.questionType == "Drag and Drop") {
            if (question.Options.length <= 1) {
              flag = false;
            }
            let assetIspresent = false;

            for (let option of question.Options) {
              if (!option.text) {
                option.isOptionSelected = true;
                flag = false;
              }
              // if (option.assetPath) {
              // 	assetIspresent = true;
              // }
            }
            // if (assetIspresent) {
            // 	for (let option of question.Options) {
            // 		if (!option.assetPath || option.assetPath == null) {
            // 			flag = false;
            // 		}
            // 	}
            // }
          }
        }
      } else if (worksheet.type == "Poll") {
        let assetIspresent = false;

        for (let question of worksheet.Questions) {
          if (!question.question) {
            question.isQuestionSelected = true;
            flag = false;
          }

          if (question.Options.length <= 1) {
            flag = false;
          }
          for (let option of question.Options) {
            if (!option.text) {
              option.isOptionSelected = true;
              flag = false;
            }
            if (option.assetPath) {
              assetIspresent = true;
            }
          }
          if (assetIspresent) {
            for (let option of question.Options) {
              if (!option.assetPath || option.assetPath == null) {
                flag = false;
              }
            }
          }
        }
      } else if (worksheet.type == "Word Cloud") {
        for (let question of worksheet.Questions) {
          if (!question.question) {
            question.isQuestionSelected = true;
            flag = false;
          }
        }
      } else if (worksheet.type == "Content") {
        //May be not required Chart
      } else if (worksheet.type == "Survey") {
        for (let question of worksheet.Questions) {
          if (!question.questionType) {
            question.isQuestionTypeSelected = true;
            flag = false;
          }
          if (!question.questionType || !question.question) {
            question.isQuestionSelected = true;
            flag = false;
          }                  
          if (
            question.questionType == "MCQ" ||
            question.questionType == "Drop Down"
          ) {
            if (question.Options.length <= 1) {
              flag = false;
            }
            for (let option of question.Options) {
              if (!option.text) {
                option.isOptionSelected = true;
                flag = false;
              }
            }
          } else if (question.questionType == "File upload") {
            if (
              question.allowFileTypes &&
              question.allowFileTypes.length == 0
            ) {
              flag = false;
            }
          }
        }
      } else if (worksheet.type == "Offline Task") {
        for (let question of worksheet.Questions) {
          if (!question.question) {
            question.isQuestionSelected = true;
            flag = false;
          }
          if (question.isFileSubmission) {
            if (
              question.allowFileTypes &&
              question.allowFileTypes.length == 0
            ) {
              flag = false;
            }
          }
        }
      } else if (worksheet.type == "Learning Content") {
        // if (
        // 	worksheet?.DiwoAssets[0]?.type == 'Video' &&
        // 	worksheet?.videoComplition &&
        // 	(worksheet.percentage == '' || worksheet.percentage == null || worksheet.percentage <= 0)
        // ) {
        // 	flag = false;
        // }
      }

      console.log('WorksheetDetail in change worksheet', this.worksheetDetail);    

    }
    return flag;
  }

  // worksheetDetail = {
  //     id: null,
  //     description: null,
  //     showTrainerInstrution: false,
  //     trainerInst: null,
  //     type: 'Content',
  //     thumbnailPath: null,
  //     flgVerify: false,
  //     flgFav: false,
  //     flgBookmark: false,
  //     flgBookmark2: false,
  //     chart: null,
  //     DiwoAssets: [],
  //     Questions: [
  //         {
  //             question: null,
  //             DiwoAssets: [],
  //             questionType: null,
  //             selectAnswer: false,
  //             answerCount: 1,
  //             Options: [{ text: null, assetPath: null, assetName: null, assetType:null ,isCorrectAnswer: false }]
  //         }
  //     ]
  // }

  checkQuestionValidation(index) {
    this.worksheetDetail.Questions[index].isQuestionSelected = false;
    // if (index) {
    // 	this.worksheetDetail.Questions[index].isQuestionSelected =
    // 		!this.worksheetDetail.Questions[index].question?.trim();
    // }
  }

  checkOptionSelected(questionIndex, optionIndex) {
    this.worksheetDetail.Questions[questionIndex].Options[
      optionIndex
    ].isOptionSelected = false;
  }

  onEnterSpinQuesScore(index) {
    this.worksheetDetail.Questions[index].isSpinQueScore = false;
  }

  changeFlag(flag, data) {
    if (!this.isviewMode) {

      console.log('flag', flag);
      console.log('data', data);

      if (
        flag != "sessionFeedback" ||
        (flag == "sessionFeedback" && this.worksheetDetail[flag] == true)
      ) {
        this.worksheetDetail[flag] = !this.worksheetDetail[flag];
      } else if (
        flag == "sessionFeedback" &&
        this.worksheetDetail[flag] == false &&
        !data.trainerSurvey
      ) {
        let temp = false;
        for (let i = 0; i < this.worksheetList.length; i++) {
          if (this.worksheetList[i].sessionFeedback == true) {
            this.sessionFeedbackSurveyIndex = i + 1;
            temp = true;
          }
        }
        if (!temp) {
          this.worksheetDetail[flag] = !this.worksheetDetail[flag];
        } else {
          $("#confirmChangeSessionFeedbackSurvy").modal("show");
        }
      }

      console.log('this.worksheetDetail before ', this.worksheetDetail);

    }
  }

  decreaseCount() {
    this.worksheetList[this.selectedWorksheetIndex].sessionFeedBackMinCount =
      this.worksheetDetail.sessionFeedBackMinCount;
  }

  increaseCount() {
    this.worksheetList[this.selectedWorksheetIndex].sessionFeedBackMaxCount =
      this.worksheetDetail.sessionFeedBackMaxCount;

    if (this.worksheetDetail.Questions.length > 0) {
      for (let question of this.worksheetDetail.Questions) {      
        if (question.questionType == "Rating scale") {
          question.Options = [];
          question.surveyMaxScale =
            this.worksheetDetail.sessionFeedBackMaxCount;
          question.surveyMinScale =
            this.worksheetDetail.sessionFeedBackMinCount;

          question.userRatingArray = [];
          for (let i = 0; i < question.surveyMaxScale; i++) {
            question.userRatingArray.push(i);
          }

          for (
            let i = 0;
            i < this.worksheetDetail.sessionFeedBackMaxCount;
            i++
          ) {
            question.Options.push({
              text: null,
              assetPath: null,
              assetName: null,
              assetType: null,
              isCorrectAnswer: false,
              isOptionSelected: false,
              characterRemainsForOption: null,
            });
          }
        }
      }
    }
  }

  onSpinQueScoreChange(question: any) {
    question.isSpinQueScore = !(question.spinQueScore > 0);
  }

  changeSessionFeedbackSurvy() {
    for (let ws of this.worksheetList) {
      ws.sessionFeedback = false;
      ws.sessionFeedBackMinCount = 0;
      ws.sessionFeedBackMaxCount = 0;
    }
    this.worksheetDetail.sessionFeedback = true;
    this.worksheetDetail.sessionFeedBackMinCount = 1;
    this.worksheetDetail.sessionFeedBackMaxCount = 5;
    this.cancelSurveyFeedbackSurvy();
  }

  cancelSurveyFeedbackSurvy() {
    $("#confirmChangeSessionFeedbackSurvy").modal("hide");
  }

  changeResultType(type) {
    if (!this.isviewMode) {
      this.worksheetDetail.chart = type;
    }
  }

  changeWorksheetType(type) {
    if (!this.isviewMode) {
      let questionType;
      if (type == "Survey") {
        questionType = "Short answer";
      } else {
        questionType = "MCQ";
      }

      console.log("this.worksheetDetail", this.worksheetDetail);

      this.worksheetDetail.Questions = [
        {
          question: null,
          quizUploadProgress: 0,
          DiwoAssets: [],
          questionType: questionType,
          SurveyRatingType: "Text",
          characterRemainsForMinLable: null,
          characterRemainsForMaxLable: null,
          userRatingArray: [],
          ratingMinLabel: null,
          ratingMaxLabel: null,
          selectAnswer: false,
          answerCount: 1,
          isQuestionSelected: false,
          isQuestionTypeSelected: false,
          characterRemainsForQuestion: null,
          characterRemainsForGeoTag: null,
          allowFileTypes: [],
          fileSize: "2 MB",
          numberOfFiles: 1,
          isTextResponse: true,
          isFileSubmission: false,
          multipleOption: false,
          isAnswerSelected: false,
          surveyCharcterLimit: null,
          surveyMinScale: 1,
          surveyMaxScale: 5,
          group_index: null,
          spinCatIndex: null,
          spinQueScore: 0,
          isSpinQueScore: false,
          uploadOnVimeo: false,
          Options: [
            {
              text: null,
              assetPath: null,
              assetName: null,
              assetType: null,
              isCorrectAnswer: false,
              isOptionSelected: false,
              characterRemainsForOption: null,
            },
          ],
        },
      ];

      if (this.worksheetList[this.selectedWorksheetIndex].type == "Follow Us") {
        this.workbookForm.controls["isMediaWorksheet"].setValue(false);
      }

      this.worksheetDetail.question_Group = false;
      this.worksheetDetail.noOfTimeSpinWheel = 1;
      this.worksheetDetail.noOfQuesForCategory = 0;
      this.worksheetDetail.showQueCategory = false;
      this.worksheetDetail.isGeoTagSelected = false;
      this.worksheetDetail.trainerSurveyDisable = false;

      if (type != "Quiz" && type != "Quiz (Randomised)") {
        this.worksheetDetail.isGraded = false;
        this.worksheetDetail.publishResult = false;
        this.worksheetDetail.isquizrandomised = false;
      }

      this.worksheetDetail.keepSurveyOn = false;
      this.worksheetDetail.keepSurveyOnDays = null;
      this.worksheetDetail.mediaWorkSheet = false;
      this.worksheetDetail.mediaProfilesData = [];
      this.worksheetDetail.briefFiles = [];
      this.worksheetDetail.pdfFiles = [];

      if (type == "Word Cloud") {
        this.worksheetDetail.chart = "Word Cloud";
      }
      if (this.worksheetDetail.type == "Word Cloud") {
        this.worksheetDetail.chart = null;
      }
      if (
        type == "Poll" ||
        type == "Quiz" ||
        type == "Quiz (Randomised)" ||
        type == "Spin The Wheel"
      ) {
        this.worksheetDetail.Questions[0].Options.push({
          text: null,
          assetPath: null,
          assetName: null,
          assetType: null,
          isCorrectAnswer: false,
          isOptionSelected: false,
          characterRemainsForOption: null,
        });
      }
      if (type == "Poll") {
        this.worksheetDetail.chart = "Scale";
      }
      if (
        type == "Quiz" ||
        type == "Quiz (Randomised)" ||
        type == "Spin The Wheel"
      ) {
        this.worksheetDetail.chart = "Bar";
        this.worksheetDetail.isGraded = true;
        this.worksheetDetail.publishResult = true;
      }
      if (type == "Offline Task") {
        this.worksheetDetail.chart = "Offline Task";
      }
      if (type == "Learning Content") {
        this.worksheetDetail.chart = "Learning Content";
      }

      if (type == "Survey") {
        this.worksheetDetail.chart = "Survey";
        this.worksheetDetail.Questions[0].Options.push({
          text: null,
          assetPath: null,
          assetName: null,
          assetType: null,
          isCorrectAnswer: false,
          isOptionSelected: false,
          characterRemainsForOption: null,
        });
      }
      this.worksheetDetail.type = type;

      this.worksheetDetail.activityTemplate = type;
    }

    console.log('WorksheetDetail in change worksheet', this.worksheetDetail);  
  }

  checkWSType(no) {
    this.selectedWSTypeNo = no;
  }

  changeActivityType() {
    console.log("-changeActivityType--");
  }

  addQuizQuestionOption(index) {
    if (!this.isviewMode) {
      if (
        this.worksheetDetail.type == "Survey" &&
        this.worksheetDetail.Questions[index].questionType !== "MCQ" &&
        this.worksheetDetail.Questions[index].questionType !== "Drop Down"
      ) {
        if (
          this.worksheetDetail.Questions[index].Options.length <
          this.worksheetDetail.Questions[index].surveyMaxScale
        ) {
          this.worksheetDetail.Questions[index].Options.push({
            text: null,
            assetPath: null,
            assetName: null,
            assetType: null,
            isCorrectAnswer: false,
            isOptionSelected: false,
            characterRemainsForOption: null,
          });

          if (
            this.worksheetDetail.Questions[index].questionType == "Rating scale"
          ) {
            this.worksheetDetail.Questions[index].userRatingArray = [];

            for (
              let i = 0;
              i < this.worksheetDetail.Questions[index].surveyMaxScale;
              i++
            ) {
              this.worksheetDetail.Questions[index].userRatingArray.push(i);
            }
            console.log(
              "this.worksheetDetail.Questions in add quiz question",
              this.worksheetDetail.Questions
            );
          }

          this.updateRatingLabels(index);
        } else if (
          this.worksheetDetail.Questions[index].Options.length >
          this.worksheetDetail.Questions[index].surveyMaxScale
        ) {
          this.worksheetDetail.Questions[index].Options.splice(
            this.worksheetDetail.Questions[index].Options.length - 1,
            1
          );

          if (
            this.worksheetDetail.Questions[index].questionType == "Rating scale"
          ) {
            this.worksheetDetail.Questions[index].userRatingArray = [];

            for (
              let i = 0;
              i < this.worksheetDetail.Questions[index].surveyMaxScale;
              i++
            ) {
              this.worksheetDetail.Questions[index].userRatingArray.push(i);
            }
            console.log(
              "this.worksheetDetail.Questions in add quiz else if",
              this.worksheetDetail.Questions
            );
          }
        }
      } else {
        this.worksheetDetail.Questions[index].Options.push({
          text: null,
          assetPath: null,
          assetName: null,
          assetType: null,
          isCorrectAnswer: false,
          isOptionSelected: false,
          characterRemainsForOption: null,
        });
      }

      if (
        this.worksheetDetail.Questions[index].questionType == "Rating scale"
      ) {
        this.worksheetDetail.Questions[index].userRatingArray = [];

        for (
          let i = 0;
          i < this.worksheetDetail.Questions[index].surveyMaxScale;
          i++
        ) {
          this.worksheetDetail.Questions[index].userRatingArray.push(i);
        }
        console.log(
          "this.worksheetDetail.Questions in add quiz question else",
          this.worksheetDetail.Questions
        );
      }
    }
  }

  removeQuizQuestionOption(questionIndex, optionIndex) {
    if (!this.isviewMode) {
      this.worksheetDetail.Questions[questionIndex].Options.splice(
        optionIndex,
        1
      );
      this.updateRatingLabels(questionIndex);
    }
  }

  addWorkSheet(flag) {
    if (!this.isviewMode) {
      if (this.workbookForm.invalid) {
        this.markAsTouched(this.workbookForm);
        return;
      }
      let payload = {
        id: null,
        worksheetUploadProgress: 0,
        description: null,
        trainerInst: null,
        showTrainerInstrution: false,
        thumbnailPath: null,
        type: flag ? "Follow Us" : "Learning Content",
        flgVerify: false,
        flgFav: true,
        flgBookmark: false,
        flgImp: false,
        flgGroupActivty: false,
        isGraded: true,
        publishResult: true,
        anonymous: false,
        trainerSurvey: false,
        trainerSurveyComp: false,
        chart: "Learning Content",
        DiwoAssets: [],
        isMediaSelected: false,
        brief: null,
        briefFiles: [],
        pdfFiles: [],
        sessionFeedback: false,
        sessionFeedBackMinCount: 1,
        sessionFeedBackMaxCount: 5,
        question_Group: false,
        questionGroups: [],
        quizRandCount: 1,
        isquizrandomised: false,
        activityTemplate: flag ? "Follow Us" : "Learning Content",
        charRemainsForactivityTemplate: null,
        noOfTimeSpinWheel: 1,
        noOfQuesForCategory: 0,
        showQueCategory: false,
        spinWheelQueCategory: [],
        isGeoTagSelected: false,
        trainerSurveyDisable: false,
        keepSurveyOn: false,
        keepSurveyOnDays: null,
        mediaWorkSheet: flag ? true : false,
        mediaProfilesData: [],
        isAssessment: false,
        isPdf: false,
        isInteractivePdf: false,
        // isAttachFile: false,
        isShowScore: true,
        timeToShowOption: "Upon Submission",
        videoComplition: this.videoComplition,
        isQuizCompletion: this.isQuizCompletion,
        maxReAttemptsAllowed: this.maxReAttemptsAllowed,
        GuideId: null,
        isGuideWorksheet: false,
        certificateData: {
          maxMark: null,
          passingMarks: null,
          condition: null,
        },
        Questions: [
          {
            question: null,
            quizUploadProgress: 0,
            DiwoAssets: [],
            questionType: "MCQ",
            SurveyRatingType: "Text",
            characterRemainsForMinLable: null,
            characterRemainsForMaxLable: null,
            userRatingArray: [],
            ratingMinLabel: null,
            ratingMaxLabel: null,
            answerCount: 1,
            selectAnswer: false,
            isQuestionSelected: false,
            isQuestionTypeSelected: false,
            characterRemainsForQuestion: null,
            characterRemainsForGeoTag: null,
            allowFileTypes: [],
            fileSize: "2 MB",
            numberOfFiles: 1,
            isTextResponse: true,
            isFileSubmission: false,
            multipleOption: false,
            isAnswerSelected: false,
            surveyCharcterLimit: null,
            surveyMinScale: 1,
            surveyMaxScale: 5,
            group_index: null,
            spinCatIndex: null,
            spinQueScore: 0,
            isSpinQueScore: false,
            uploadOnVimeo: false,

            Options: [
              {
                text: null,
                assetPath: null,
                assetName: null,
                assetType: null,
                isCorrectAnswer: false,
                isOptionSelected: false,
                characterRemainsForOption: null,
              },
            ],
          },
        ],
      };
      if (this.selectedWorksheetIndex !== null) {
        this.worksheetList.splice(this.selectedWorksheetIndex + 1, 0, payload);
        this.worksheetDetail = payload;
        this.selectedWorksheetIndex = this.selectedWorksheetIndex + 1;
      } else {
        this.worksheetList.push(payload);
        this.worksheetDetail = payload;
        this.selectedWorksheetIndex = this.worksheetList.length - 1;
      }
      this.addOneQuestionGroup();
      this.addOneSpinQuestionCategory();
    }
  }

  checkCharacterLimitForModuleTitle() {
    let title = this.workbookForm.controls["title"].value;
    this.characterRemainsForModuleTitle = title
      ? this.maxLengthForModuleTitle - title.length
      : this.maxLengthForModuleTitle;
  }

  checkCharacterLimitForModuleDescription() {
    let descrip = this.workbookForm.controls["descrip"].value;
    this.characterRemainsForModuleDescription = descrip
      ? this.maxLengthForModuleDescription - descrip.length
      : this.maxLengthForModuleDescription;
  }

  checkcharacterlimitForQuestion(questionIndex) {
    if (questionIndex != null) {
      // for question
      this.worksheetDetail.Questions[
        questionIndex
      ].characterRemainsForQuestion =
        this.worksheetDetail.Questions[questionIndex] &&
        this.worksheetDetail.Questions[questionIndex].question
          ? this.maxLengthForQuestion -
            this.worksheetDetail.Questions[questionIndex].question.length
          : this.maxLengthForQuestion;
    }
  }

  checkCharacterLimitForGeoTag(questionIndex) {
    if (questionIndex != null) {
      // for question
      this.worksheetDetail.Questions[questionIndex].characterRemainsForGeoTag =
        this.worksheetDetail.Questions[questionIndex] &&
        this.worksheetDetail.Questions[questionIndex].question
          ? this.maxLengthForGeoTag -
            this.worksheetDetail.Questions[questionIndex].question.length
          : this.maxLengthForGeoTag;
    }
  }

  checkcharacterlimitForOption(questionIndex, optionIndex) {
    if (questionIndex != null && optionIndex != null) {
      this.worksheetDetail.Questions[questionIndex].Options[
        optionIndex
      ].characterRemainsForOption =
        this.maxLengthForOption -
        (this.worksheetDetail.Questions[questionIndex].Options[optionIndex].text
          ? this.worksheetDetail.Questions[questionIndex].Options[optionIndex]
              .text.length
          : 0);

      this.updateRatingLabels(questionIndex);
    }
    if (questionIndex != null && optionIndex != null) {
      this.worksheetDetail.Questions[questionIndex].Options[
        optionIndex
      ].isOptionSelected = false;
    }
  }

  checkCharacterLimitForMin(questionIndex) {
    if (questionIndex != null) {
      this.worksheetDetail.Questions[
        questionIndex
      ].characterRemainsForMinLable =
        this.maxLengthForMinMaxLabel -
        this.worksheetDetail.Questions[questionIndex].ratingMinLabel.length;
    }
  }

  checkCharacterLimitForMax(questionIndex) {
    if (questionIndex != null) {
      this.worksheetDetail.Questions[
        questionIndex
      ].characterRemainsForMaxLable =
        this.maxLengthForMaxMaxLabel -
        this.worksheetDetail.Questions[questionIndex].ratingMaxLabel.length;
    }
  }

  checkcharlimitForactivityTemplate() {
    this.worksheetDetail.charRemainsForactivityTemplate =
      this.maxLengthForctivityTemplate -
      this.worksheetDetail.activityTemplate.length;
  }

  copyWSMedia(index, data) {
    if (!this.isviewMode) {
      let payload_1 = JSON.stringify(data);
      let payload_2 = JSON.parse(payload_1);
      payload_2.id = null;
      this.worksheetList.splice(index + 1, 0, payload_2);
      setTimeout(() => {
        this.worksheetDetail = this.worksheetList[index + 1];
        this.selectedWorksheetIndex = index + 1;
      }, 100);
    }
  }

  getWorkbookById(wookbookId) {
    this.showModuleTypeSelection = false;
    this.workbookService
      .getWorkbookById(this.selectedClientId, wookbookId)
      .subscribe((res: any) => {
        if (res.success) {
          this.workbookForm.patchValue(res.data);

          if (res.data.CertificateLine1) {
            this.checkCharLimitForCertificateLine(
              res.data.CertificateLine1,
              "CertificateLine1"
            );
          }

          if (res.data.CertificateLine2) {
            this.checkCharLimitForCertificateLine(
              res.data.CertificateLine2,
              "CertificateLine2"
            );
          }

          if (res.data.CertificateLine3) {
            this.checkCharLimitForCertificateLine(
              res.data.CertificateLine3,
              "CertificateLine3"
            );
          }

          if (res.data.signatureName1) {
            this.checkCharLimitForSignatureName(
              res.data.signatureName1,
              "signatureName1"
            );
          }

          if (res.data.signatureName2) {
            this.checkCharLimitForSignatureName(
              res.data.signatureName2,
              "signatureName2"
            );
          }

          if (res.data.signatureDesignation1) {
            this.checkCharLimitForSignatureDesignation(
              res.data.signatureName2,
              "signatureDesignation1"
            );
          }

          if (res.data.signatureDesignation2) {
            this.checkCharLimitForSignatureDesignation(
              res.data.signatureDesignation2,
              "signatureDesignation2"
            );
          }

          if (res.data.signatureName2 || res.data.signaturePath2) {
            this.signatureAuthorityIndex = 2;
          } else if (res.data.signatureName1 || res.data.signaturePath1) {
            this.signatureAuthorityIndex = 1;
          }

          if (res.data.isAppliedCertificate) {
            this.stepsBar = [1, 2, 3];
            this.stepsBar = [...this.stepsBar];
          } else {
            this.stepsBar = [1, 2];
            this.stepsBar = [...this.stepsBar];
          }

          if (res.data && res.data.Courses && res.data.Courses.length > 0) {
            this.workbookForm.controls["CourseId"].setValue(
              res.data.Courses[0].id
            );
            this.workbookForm.controls["CourseName"].setValue(
              res.data.Courses[0].title
            );
          }

          if (res.data && res.data.DiwoModule) {
            this.selectedModuleType = res.data.DiwoModule.id;
          }

          this.worksheetList = res.data.Worksheets;

          console.log("this.worksheetList", this.worksheetList);

          // Display Uploaded PDF
          for (let data of this.worksheetList) {
            if (data.type === "Learning Content") {
              data.pdfFiles = [];

              for (let diwoAsset of data.DiwoAssets) {
                if (diwoAsset.type === "Document") {
                  data.pdfFiles.push({
                    path: diwoAsset.path,
                    fileName: diwoAsset.fileName,
                    type: diwoAsset.type,
                    isPdf: diwoAsset.isPdf,
                  });

                  if (diwoAsset.isPdf) {
                    this.worksheetDetail.isPdf = true;
                  }
                }
              }
            }
          }

          for (let data of this.worksheetList) {
            //for survey question Group
            if (data.questionGroups.length == 0) {
              data.questionGroups = [
                ...data.questionGroups,
                {
                  index: 0,
                  group_name: null,
                },
              ];
            } else {
              data.questionGroups = data.questionGroups;
            }

            if (data.type == "Quiz (Randomised)") {
              data.isquizrandomised = true;
            }

            if (data.type == "Spin The Wheel") {
              this.isZeroSpinQuesCategory = false;
              if (data.noOfQuesForCategory > 0) {
                data.showQueCategory = true;
              }
            }

            if (
              data.certificateData == null ||
              data.certificateData == undefined
            ) {
              data.certificateData = {
                maxMark: 0,
                passingMarks: null,
                condition: "",
              };
            }

            //for social media platform
            if (res.data && res.data.isMediaWorksheet) {
              if (
                (data.mediaProfilesData &&
                  data.mediaProfilesData.length == 0) ||
                data.mediaProfilesData == null ||
                data.mediaProfilesData == ""
              ) {
                data.mediaProfilesData = [
                  {
                    index: 0,
                    mediaName: null,
                    mediaLink: null,
                    mediaHandle: null,
                    isClick: false,
                    date: null,
                    isPlatformError: false,
                    isPlatformURLError: false,
                    isPlatformURLValidError: false,
                    isDuplicatePlateForm: false,
                  },
                ];
              } else {
                data.mediaProfilesData = data.mediaProfilesData;
              }
            }

            //for spin the wheel template
            if (data.spinWheelQueCategory.length == 0) {
              data.spinWheelQueCategory = [
                ...data.spinWheelQueCategory,
                {
                  category_index: 1,
                  category_name: null,
                  totalquestion: 0,
                  totalscore: 0,
                  characterRemain: 0,
                },
              ];
            } else {
              data.spinWheelQueCategory = data.spinWheelQueCategory;
            }

            data.charRemainsForactivityTemplate =
              this.maxLengthForctivityTemplate -
              (data && data.activityTemplate
                ? data.activityTemplate.length
                : 0);

            for (let datas of data.Questions) {
              //check survey geo tag type selected or not
              if (datas.allowFileTypes) {
                datas.allowFileTypes = datas.allowFileTypes.split(",");
              } else {
                datas.allowFileTypes = [];
              }

              if (datas.questionType == "Geo Tag") {
                data.isGeoTagSelected = true;
                data.trainerSurveyDisable = true;
              } else {
                data.isGeoTagSelected = false;
                data.trainerSurveyDisable = false;
              }

              datas.surveyCharcterLimit =
                datas && datas.surveyCharLimit ? datas.surveyCharLimit : null;

              datas.characterRemainsForQuestion =
                this.maxLengthForQuestion -
                (datas && datas.question ? datas.question.length : 0);

              datas.characterRemainsForGeoTag =
                this.maxLengthForGeoTag -
                (datas && datas.question ? datas.question.length : 0);

              datas.characterRemainsForMinLable =
                this.maxLengthForMinMaxLabel -
                (datas.ratingMinLabel ? datas.ratingMinLabel.length : 0);

              datas.characterRemainsForMaxLable =
                this.maxLengthForMaxMaxLabel -
                (datas.ratingMaxLabel ? datas.ratingMaxLabel.length : 0);

              for (let op of datas.Options) {
                op.characterRemainsForOption =
                  this.maxLengthForOption - (op.text ? op.text.length : 0);
              }
            }

            if (
              data.spinWheelQueCategory &&
              data.spinWheelQueCategory.length > 0
            ) {
              data.spinWheelQueCategory = data.spinWheelQueCategory.map(
                (item) => ({
                  ...item,
                  disabled: item.totalquestion >= data.noOfQuesForCategory,
                })
              );
            }
          }
        }

        if (this.editWorkbook && this.editWorkbook.type == "copy") {
          this.workbookForm.controls["title"].setValue(
            "Copy of - " + res.data.title
          );
          this.workbookForm.controls["id"].setValue(null);

          for (let data of this.worksheetList) {
            data.id = null;
            data.WorkbookId = null;
            delete data.createdAt;
            delete data.updatedAt;
            data.ClientId = null;
            data.briefFiles = [];
            data.pdfFiles = [];

            // Display Uploaded PDF

            if (data.type === "Learning Content") {
              data.pdfFiles = [];

              for (let diwoAsset of data.DiwoAssets) {
                if (diwoAsset.type === "Document") {
                  data.pdfFiles.push({
                    path: diwoAsset.path,
                    fileName: diwoAsset.fileName,
                    type: diwoAsset.type,
                    isPdf: diwoAsset.isPdf,
                  });

                  if (diwoAsset.isPdf) {
                    this.worksheetDetail.isPdf = true;
                  }
                }
              }
            }

            if (
              data &&
              data.questionGroups &&
              data.questionGroups.length == 0
            ) {
              data.questionGroups = [
                ...data.questionGroups,
                {
                  index: 0,
                  group_name: null,
                },
              ];
            } else {
              data.questionGroups = data.questionGroups;
            }

            if (
              data &&
              data.spinWheelQueCategory &&
              data.spinWheelQueCategory.length == 0
            ) {
              data.spinWheelQueCategory = [
                ...data.spinWheelQueCategory,
                {
                  category_index: 1,
                  category_name: null,
                  totalquestion: 0,
                  totalscore: 0,
                  characterRemain: 0,
                },
              ];
            } else {
              data.spinWheelQueCategory = data.spinWheelQueCategory;
            }

            data.charRemainsForactivityTemplate =
              this.maxLengthForctivityTemplate -
              (data && data.activityTemplate
                ? data.activityTemplate.length
                : 0);

            for (let asset of data.DiwoAssets) {
              asset.id = null;
              asset.ClientId = null;
              asset.WorkbookId = null;
              asset.WorksheetId = null;
              asset.QuestionId = null;
              asset.createdAt = null;
              asset.updatedAt = null;
            }

            for (let datas of data.Questions) {
              datas.id = null;
              datas.ClientId = null;
              datas.WorkbookId = null;
              datas.WorksheetId = null;
              datas.createdAt = null;
              datas.updatedAt = null;
              datas.DiwoSpinWheelCatId = null;

              datas.characterRemainsForQuestion =
                this.maxLengthForQuestion -
                (datas && datas.question ? datas.question.length : 0);
              datas.characterRemainsForGeoTag =
                this.maxLengthForGeoTag -
                (datas && datas.question ? datas.question.length : 0);

              if (datas.questionType == "Geo Tag") {
                data.isGeoTagSelected = true;
                data.trainerSurveyDisable = true;
              } else {
                data.isGeoTagSelected = false;
                data.trainerSurveyDisable = false;
              }

              for (let op of datas.Options) {
                op.id = null;
                op.QuestionId = null;
                op.ClientId = null;
                op.WorkbookId = null;
                op.WorksheetId = null;
                op.createdAt = null;
                op.updatedAt = null;

                op.characterRemainsForOption =
                  this.maxLengthForOption - (op.text ? op.text.length : 0);
              }

              // let minLabel: string | null = null;
              // let maxLabel: string | null = null;

              // if(datas.questionType == 'Rating scale'){
              //   for (let op of datas.Options) {
              //     const trimmedText = op.text?.trim();
              //     if (trimmedText) {
              //       // Set minLabel if not already set
              //       if (minLabel === null) {
              //         minLabel = trimmedText;
              //       }
              //       // Always update maxLabel to the latest non-empty value
              //       maxLabel = trimmedText;
              //     }
              //   }
              //   datas.ratingMinLabel = minLabel;
              //   datas.ratingMaxLabel = maxLabel;
              // }
            }
          }

          if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
            this.workbookService
              .getAllClientAndBranchAccountList(this.selectedClientId)
              .subscribe((res: any) => {
                if (res.success) {
                  this.selectedClientId = null;
                  this.clientList = [];
                  this.clientList = res.data;
                  this.selectedClient = this.selectedClientId;

                  for (let client of res.data) {
                    if (client.id == parseInt(this.editWorkbook.copyClientId)) {
                      this.selectedClientId = client.id;
                    }
                  }
                  $("#selecteClientList").modal("show");
                }
              });
          }
        }

        this.checkCharacterLimitForModuleTitle();
        this.checkCharacterLimitForModuleDescription();

        if (this.editWorkbook && this.editWorkbook.type == "view") {
          this.workbookForm.disable();
          this.isviewMode = true;
        }

        if (this.appService?.configurable_feature?.vimeo) {
          this.checkVideoTranscodingStatus();
          this.checkVideoTranscodingStatusForQuestion();
        }

        if (this.appService?.configurable_feature?.mediaCMS) {
          this.checkMediaCMSVideoTranscodingStatus();
          this.checkMediaCMSVideoTranscodingStatusForQuestion();
        }

        this.checkAssessment(true);
      });
  }

  getLearnerGroupByUserId(userId, clientId, roleId) {
    this.workbookService
      .getLearnerGroupByUserId(userId, clientId, roleId)
      .subscribe((res: any) => {
        if (res.success) {
          this.learnerGroupList = [];
          this.learnerGroupList.push({
            id: 0,
            title: "Create New Group",
          });
          for (let learnerGroup of res.data) {
            if (learnerGroup.is_deleted == false) {
              this.learnerGroupList.push(learnerGroup);
            }
          }
        }
      });
  }

  save(status, comingFrom?) {
    if (this.workbookForm.invalid) {
      this.markAsTouched(this.workbookForm);
      return;
    }

    console.log("this.workbookForm", this.workbookForm.value);

    for (let i = 0; i < this.worksheetList.length; i++) {
      let status = false;
      this.selectedWorksheetIndex = i;
      status = this.checkWorksheet("save");
      if (!status) {
        this.selectedWorksheetErrorIndex = i;
        this.toastr.warning(
          this.appService.getTranslation(
            "Pages.Workbook.AddEdit.Toaster.allrequiredfield"
          ),
          this.appService.getTranslation("Utils.warning")
        );
        return;
      }

      if (
        (["Learning Content", "Discussion"].indexOf(
          this.worksheetList[this.selectedWorksheetIndex].type
        ) != -1 &&
          this.worksheetList[this.selectedWorksheetIndex]?.DiwoAssets[0]
            ?.type != "Video") ||
        ["Learning Content", "Discussion"].indexOf(
          this.worksheetList[this.selectedWorksheetIndex].type
        ) == -1
      ) {
        this.worksheetList[this.selectedWorksheetIndex].videoComplition = false;
      }

      if (this.worksheetList[this.selectedWorksheetIndex].type != "Quiz") {
        this.worksheetList[this.selectedWorksheetIndex].isQuizCompletion =
          false;
        this.worksheetList[
          this.selectedWorksheetIndex
        ].maxReAttemptsAllowed = 0;
      }

      if (this.worksheetList[this.selectedWorksheetIndex].type == "Quiz") {
        this.worksheetList[this.selectedWorksheetIndex].isQuizCompletion =
          this.isQuizCompletion;
        this.worksheetList[this.selectedWorksheetIndex].maxReAttemptsAllowed =
          this.maxReAttemptsAllowed;
      }
    }

    let payload = {
      workbook_detail: this.workbookForm.value,
      wooksheet_details: this.worksheetList,
    };

    console.log("payload", payload);

    if (status) {
      payload.workbook_detail.status = "Published";
    } else {
      payload.workbook_detail.status = "Draft";
    }

    payload.workbook_detail.DiwoModuleId = this.selectedModuleType;

    if (comingFrom == "preview") {
      this.isPreviewAvailable = true;
    }

    if (
      this.worksheetDetail.isAssessment == true &&
      payload.workbook_detail.haveCertificate == false
    ) {
      this.spinnerService.hide();
      this.toastr.error(
        this.appService.getTranslation(
          "Pages.Workbook.AddEdit.Toaster.certificateIsNotAdded"
        )
      );
      return;
    }

    // console.log('--payload in save workbook --', payload);
    // return;

    this.spinnerService.show();
    if (!this.workbookForm.value.id) {
      this.workbookService
        .createWorkbook(payload, this.selectedClientId)
        .subscribe((res: any) => {
          if (res.success) {
            // let id = res.data.id;
            let id = res.WorkbookId;
            this.workbookForm.controls["id"].setValue(id);
            if (comingFrom == "saveBtn") {
              this.toastr.success(
                this.appService.getTranslation(
                  "Pages.Workbook.AddEdit.Toaster.workbookcreated"
                ),
                this.appService.getTranslation("Utils.success")
              );
              localStorage.setItem("isRedirectAllowed", "true");
              this.router.navigate(["module"]);
            }            
            this.viewWorkBookUrl = `${environment.diwoAppUrl}?author_preview=true&moduleId=${id}}`;

            if (comingFrom == "preview") {            
              setTimeout(() => {
                this.showWorkbookPreview();
                this.isPreviewAvailable = false;
              }, 500);
            }

            this.spinnerService.hide();
          } else {
            this.spinnerService.hide();
            this.toastr.error(
              res.error,
              this.appService.getTranslation("Utils.error")
            );
            if (comingFrom == "saveBtn") {
              localStorage.setItem("isRedirectAllowed", "true");
              this.router.navigate(["module"]);
            }
          }
        });
    } else {
      this.workbookService
        .updateWorkbook(
          payload,
          this.selectedClientId,
          this.workbookForm.value.id
        )
        .subscribe((res: any) => {
          if (res.success) {
            // if (res.data.status == 'Published') {
            if (comingFrom == "saveBtn") {
              this.toastr.success(
                this.appService.getTranslation(
                  "Pages.Workbook.AddEdit.Toaster.workbookupdated"
                ),
                this.appService.getTranslation("Utils.success")
              );
              localStorage.setItem("isRedirectAllowed", "true");
              this.router.navigate(["module"]);
            }
            // } else {
            //     this.getWorkbookById(parseInt(this.workbookForm.value.id));
            // }
            if (comingFrom == "preview") {
              setTimeout(() => {
                this.showWorkbookPreview();
                this.isPreviewAvailable = false;
              }, 500);
            }

            this.spinnerService.hide();
          } else {
            this.spinnerService.hide();
            this.toastr.error(
              res.error,
              this.appService.getTranslation("Utils.error")
            );
            if (comingFrom == "saveBtn") {
              localStorage.setItem("isRedirectAllowed", "true");
              this.router.navigate(["module"]);
            }
          }
        });
    }
  }

  addQuestion() {
    if (!this.isviewMode) {
      let status = this.checkWorksheet("addQuestion");
      if (
        this.worksheetDetail &&
        this.worksheetDetail.type == "Spin The Wheel" &&
        this.worksheetDetail.spinWheelQueCategory &&
        this.worksheetDetail.spinWheelQueCategory.length > 0
      ) {
        // this.worksheetDetail.spinWheelQueCategory = this.worksheetDetail.spinWheelQueCategory.map((item) =>
        // 	item.totalquestion < this.worksheetDetail.noOfQuesForCategory ? item : { ...item, disabled: true }
        // );

        if (
          this.worksheetDetail.spinWheelQueCategory &&
          this.worksheetDetail.spinWheelQueCategory.length > 0
        ) {
          this.worksheetDetail.spinWheelQueCategory =
            this.worksheetDetail.spinWheelQueCategory.map((item) => ({
              ...item,
              disabled:
                item.totalquestion >= this.worksheetDetail.noOfQuesForCategory,
            }));
        }
      }
      if (status) {
        let questionType;
        if (this.worksheetDetail.type == "Survey") {
          questionType = "Short answer";
        } else {
          questionType = "MCQ";
        }
        this.worksheetDetail.Questions.push({
          question: null,
          quizUploadProgress: 0,
          DiwoAssets: [],
          questionType: questionType,
          SurveyRatingType: "Text",
          characterRemainsForMinLable: null,
          characterRemainsForMaxLable: null,
          userRatingArray: [],
          ratingMinLabel: null,
          ratingMaxLabel: null,
          selectAnswer: false,
          answerCount: 1,
          isQuestionSelected: false,
          isQuestionTypeSelected: false,
          characterRemainsForQuestion: null,
          characterRemainsForGeoTag: null,
          allowFileTypes: [],
          fileSize: "2 MB",
          numberOfFiles: 1,
          isTextResponse: true,
          isFileSubmission: false,
          multipleOption: false,
          isAnswerSelected: false,
          surveyCharcterLimit: null,
          surveyMinScale: 1,
          surveyMaxScale: 5,
          group_index: null,
          spinCatIndex: null,
          spinQueScore: 0,
          isSpinQueScore: false,
          uploadOnVimeo: false,
          Options: [
            {
              text: null,
              assetPath: null,
              assetName: null,
              assetType: null,
              isCorrectAnswer: false,
              isOptionSelected: false,
              characterRemainsForOption: null,
            },
            {
              text: null,
              assetPath: null,
              assetName: null,
              assetType: null,
              isCorrectAnswer: false,
              isOptionSelected: false,
              characterRemainsForOption: null,
            },
          ],
        });

        if (this.worksheetDetail.type == "Survey") {
          const newQuestion =
            this.worksheetDetail.Questions[
              this.worksheetDetail.Questions.length - 1
            ];

          if (newQuestion.questionType == "Rating scale") {
            newQuestion.userRatingArray = [];
            for (let i = 0; i < newQuestion.surveyMaxScale; i++) {
              newQuestion.userRatingArray.push(i);
            }
          }
        }
      }
    }
  }

  deleteQuestion(index) {
    if (!this.isviewMode) {
      this.worksheetDetail.Questions.splice(index, 1);
    }
  }

  updateImg() {
    console.log("update img");
  }

  uploadMedia(event, questionIndex?, optionIndex?, isQuestion?, flag?) {
    this.imgQuestionIndex = questionIndex;
    this.imgOptionIndex = optionIndex;
    this.imgIsquestion = isQuestion;

    if (flag) {
      if (
        event &&
        event.target.files[0] &&
        event.target.files[0].type.includes("image")
      ) {
        this.spinnerService.show();
        if (event.target.files && event.target.files.length > 1) {
          for (let media of event.target.files) {
            if (media.type.includes("image")) {
              let uploadData;
              uploadData = new FormData();
              uploadData.append("Image", media);
              if (media.size >= 5242880) {
                this.toastr.error(
                  this.appService.getTranslation(
                    "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                  ),
                  this.appService.getTranslation("Utils.error")
                );
                this.spinnerService.hide();
              } else {
                this.workbookService
                  .uploadDiwoMedia(uploadData)
                  .subscribe((res: any) => {
                    this.spinnerService.hide();
                    if (res.success) {
                      if (this.imgIsquestion) {
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].DiwoAssets = [];
                      } else {
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetPath = null;
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetName = null;
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetType = null;
                      }

                      if (this.imgIsquestion) {
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].DiwoAssets.push({
                          path:
                            res.data.media_path + res.data.Image[0].filename,
                          type: "Image",
                          fileName: res.data.Image[0].originalname,
                        });
                      } else if (!this.imgIsquestion) {
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetPath =
                          res.data.media_path + res.data.Image[0].filename;
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetName =
                          res.data.Image[0].originalname;
                        this.worksheetDetail.Questions[
                          this.imgQuestionIndex
                        ].Options[this.imgOptionIndex].assetType = "Image";
                      }
                    }
                  });
              }
            }
          }
        } else if (event.target.files && event.target.files.length == 1) {
          let type;
          if (event.target.files[0].type.includes("video")) {
            type = "Video";
          } else if (event.target.files[0].type.includes("image")) {
            type = "Image";
          } else {
            type = "Document";
          }

          let uploadData;
          uploadData = new FormData();
          uploadData.append(type, event.target.files[0]);
          if (event.target.files[0].size >= 5242880) {
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.maxImageSize"
              ),
              this.appService.getTranslation("Utils.error")
            );
            this.spinnerService.hide();
          } else {
            this.workbookService
              .uploadDiwoMedia(uploadData)
              .subscribe((res: any) => {
                this.spinnerService.hide();
                if (res.success) {
                  if (this.imgIsquestion) {
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].DiwoAssets = [];
                  } else {
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetPath = null;
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetName = null;
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetType = null;
                  }

                  if (this.imgIsquestion) {
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].DiwoAssets.push({
                      path: res.data.media_path + res.data.Image[0].filename,
                      type: type,
                      fileName: res.data.Image[0].originalname,
                    });
                  } else if (!this.imgIsquestion) {
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetPath =
                      res.data.media_path + res.data.Image[0].filename;
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetName =
                      res.data.Image[0].originalname;
                    this.worksheetDetail.Questions[
                      this.imgQuestionIndex
                    ].Options[this.imgOptionIndex].assetType = type;
                  }
                }
              });
          }
        }
      } else {
        let selectedMediaAssetDetails = [];
        if (
          event.target &&
          event.target.files &&
          event.target.files.length > 0
        ) {
          for (let media of event.target.files) {
            let fileName = media.name;
            let mediaType = media.type;
            fileName = fileName.replace(".mp4", "");
            if (mediaType.includes("video")) {
              mediaType = "Video";
            }
            let payload = {
              title: fileName,
              type: mediaType,
              otherDetails: media,
              size: media.size,
            };
            selectedMediaAssetDetails.push(payload);
          }

          this.toastr.success(
            this.appService.getTranslation(
              "Pages.Workbook.AddEdit.Toaster.vimeovideouploading"
            ),
            this.appService.getTranslation("Utils.success")
          );

          for (let asset of selectedMediaAssetDetails) {
            if (asset.type == "Video") {
              this.spinnerService.show();
              if (asset) {
                this.spinnerService.show();
                if (this.appService?.configurable_feature?.mediaCMS) {
                  ////////////////////////////////////////////////////////////////////////////////////////
                  const uploadData = new FormData();
                  for (var key in asset) {
                    if (key == "otherDetails") {
                      uploadData.append(asset.type, asset[key]);
                    } else {
                      if (key != "Preview") {
                        uploadData.append(key, asset[key]);
                      }
                    }
                  }
                  this.workbookService
                    .canUploadVideoOnMediaCMS()
                    .subscribe((res: any) => {
                      if (res.success) {
                        if (res.canUpload) {
                          this.workbookService
                            .uploadVideoOnMediaCMS(
                              uploadData,
                              this.selectedClientId
                            )
                            .subscribe({
                              next: (event: HttpEvent<any>) => {
                                if (
                                  event.type === HttpEventType.UploadProgress &&
                                  event.total
                                ) {
                                  const percentDone = Math.round(
                                    (event.loaded / event.total) * 100
                                  );
                                  this.worksheetDetail.Questions[
                                    questionIndex
                                  ].quizUploadProgress = percentDone;
                                }

                                if (event.type === HttpEventType.Response) {
                                  const res = event.body;

                                  if (res) {
                                    asset.cmsVideoId = res.data.videoId;
                                    asset.MediaCMSUploadQueueId =
                                      res.data.MediaCMSUploadQueueId;
                                    asset.size = res.data.size;

                                    this.spinnerService.hide();
                                    this.worksheetDetail.Questions[
                                      questionIndex
                                    ].DiwoAssets = [];
                                    this.worksheetDetail.Questions[
                                      this.imgQuestionIndex
                                    ].DiwoAssets = [];
                                    this.worksheetDetail.Questions[
                                      this.imgQuestionIndex
                                    ].DiwoAssets.push({
                                      path: null,
                                      type: "Video",
                                      fileName: res.data.filename,
                                      cmsVideoId: asset.cmsVideoId,
                                      Transcoding: false,
                                      isTranscoding: false,
                                      MediaCMSUploadQueueId:
                                        asset.MediaCMSUploadQueueId,
                                      MediaUploadStatus: "queued",
                                    });
                                    this.checkMediaCMSVideoTranscodingStatusForQuestion();
                                  }
                                }
                              },
                            });
                        } else {
                          this.toastr.error(
                            this.appService.getTranslation(
                              "Pages.Workbook.AddEdit.diskfullTranscodingVideoText"
                            ),
                            this.appService.getTranslation("Utils.error")
                          );
                        }
                      } else {
                        this.toastr.error(
                          this.appService.getTranslation(
                            "Pages.Workbook.AddEdit.diskfullTranscodingVideoText"
                          ),
                          this.appService.getTranslation("Utils.error")
                        );
                      }
                    });
                } else if (this.appService?.configurable_feature?.vimeo) {
                  asset.data = null;
                  const options = {
                    token: this.vimeoDetails.vToken,
                    url: environment.VimeoUploadApi,
                    videoName: asset.title,
                    videoDescription: asset.description,
                  };
                  if (this.vimeoDetails == false) {
                    this.toastr.error(
                      this.appService.getTranslation(
                        "Utils.novimeocredentials"
                      ),
                      this.appService.getTranslation("Utils.error")
                    );
                    this.spinnerService.hide();
                    return;
                  }

                  this.workbookService
                    .createVimeo(options, asset.otherDetails.size)
                    .pipe(
                      map((data) => (asset.data = data)),
                      switchMap(() => {
                        this.workbookService.updateVimeoLink(asset.data.link);
                        if (
                          asset.data.upload.size === asset.otherDetails.size
                        ) {
                          return this.workbookService.vimeoUpload(
                            asset.data.upload.upload_link,
                            asset.otherDetails
                          );
                        }
                      })
                    )
                    .subscribe(
                      (event) => {
                        if (event.type === HttpEventType.UploadProgress) {
                          this.uploadPercent = Math.round(
                            (100 * event.loaded) / event.total
                          );
                        } else if (event instanceof HttpResponse) {
                          let vmoVideoId_ = this.getVimeoUserIdFromUrl(
                            asset.data.uri
                          );
                          asset.path = asset.data.player_embed_url;
                          asset.vmoVideoId = vmoVideoId_;

                          this.spinnerService.hide();
                          this.worksheetDetail.Questions[
                            questionIndex
                          ].DiwoAssets = [];
                          this.worksheetDetail.Questions[
                            this.imgQuestionIndex
                          ].DiwoAssets = [];
                          this.worksheetDetail.Questions[
                            this.imgQuestionIndex
                          ].DiwoAssets.push({
                            path: asset.data.player_embed_url,
                            type: "Video",
                            fileName: asset.data.name,
                            vmoVideoId: vmoVideoId_,
                            Transcoding: false,
                            isTranscoding: false,
                          });
                          this.checkVideoTranscodingStatusForQuestion();
                          this.workbookService
                            .MoveAssetToFolder(
                              vmoVideoId_,
                              this.selectedClientId
                            )
                            .subscribe((res: any) => {
                              if (res.success) {
                                this.spinnerService.hide();
                              } else {
                                this.spinnerService.hide();
                              }
                            });

                          const options = {
                            token: this.vimeoDetails.vToken,
                            url: environment.VimeoPresetApi,
                            presetId: this.vimeoDetails.presetId,
                            videoId: asset.vmoVideoId,
                          };
                          this.workbookService
                            .applyEmbedPreset(options)
                            .subscribe((res: any) => {});
                        }
                      },
                      (error) => {
                        console.log("Upload Error:", error);
                      },
                      () => {
                        console.log("Upload done");
                      }
                    );
                }
              }
            }
          }
        }
      }
      this.cancelMediaPopUp();
    } else {
      if (event && event.name && event.name.indexOf(".mp4") != -1) {
        let payload = {
          fileId: event.id,
          name: event.name,
          assetType: "Video",
        };
        //For Video
        this.workbookService
          .checkAddDonwloadAssetFormGoogleDrive(payload)
          .subscribe((res: any) => {
            if (res.success) {
              this.worksheetDetail.Questions[questionIndex].DiwoAssets = [];
              this.worksheetDetail.Questions[this.imgQuestionIndex].DiwoAssets =
                [];
              this.worksheetDetail.Questions[
                this.imgQuestionIndex
              ].DiwoAssets.push({
                path: res.data.path,
                type: "Video",
                fileName: res.data.name,
                vmoVideoId: res.data.vmoVideoId,
                Transcoding: false,
              });

              if (this.appService?.configurable_feature?.vimeo) {
                this.checkVideoTranscodingStatusForQuestion();
              }

              if (this.appService?.configurable_feature?.mediaCMS) {
                this.checkMediaCMSVideoTranscodingStatusForQuestion();
              }

              this.workbookService
                .MoveAssetToFolder(res.data.vmoVideoId, this.selectedClientId)
                .subscribe((res: any) => {
                  if (res.success) {
                    this.spinnerService.hide();
                  } else {
                    this.spinnerService.hide();
                  }
                });
              const options = {
                token: this.vimeoDetails.vToken,
                url: environment.VimeoPresetApi,
                presetId: this.vimeoDetails.presetId,
                videoId: res.data.vmoVideoId,
              };
              this.workbookService
                .applyEmbedPreset(options)
                .subscribe((res: any) => {});
              this.cancelMediaPopUp();
            }
          });
      } else {
        if (parseInt(event.target.files[0].size) >= 5242880) {
          this.spinnerService.hide();
          this.toastr.error(
            this.appService.getTranslation(
              "Pages.Workbook.AddEdit.Toaster.maxImageSize"
            ),
            this.appService.getTranslation("Utils.error")
          );
        } else {
          let payload = {
            fileId: event.id,
            name: event.name,
            assetType: "Image",
          };
          this.workbookService
            .checkAddDonwloadAssetFormGoogleDrive(payload)
            .subscribe((res: any) => {
              if (res.success) {
                this.spinnerService.hide();

                if (this.imgIsquestion) {
                  this.worksheetDetail.Questions[
                    this.imgQuestionIndex
                  ].DiwoAssets = [];
                } else {
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetPath = null;
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetName = null;
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetType = null;
                }

                if (this.imgIsquestion) {
                  this.worksheetDetail.Questions[
                    this.imgQuestionIndex
                  ].DiwoAssets.push({
                    path: res.data.path,
                    type: "Image",
                    fileName: res.data.fileName,
                  });
                } else if (!this.imgIsquestion) {
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetPath =
                    res.data && res.data.path ? res.data.path : null;
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetName =
                    res.data && res.data.fileName ? res.data.fileName : null;
                  this.worksheetDetail.Questions[this.imgQuestionIndex].Options[
                    this.imgOptionIndex
                  ].assetType = "Image";
                }
                this.cancelMediaPopUp();
              }
            });
        }
      }
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
          if (checkCondition == "check for vertical") {
            if (
              img.height / img.width > 1.33 &&
              img.height / img.width < 1.34
            ) {
              imgMode = true;
            }
          }

          if (checkCondition == "check for horizontal") {
            if (img.width / img.height > 1.7 && img.width / img.height < 1.8) {
              imgMode = true;
            }
          }

          if (checkCondition == "check for signature authority") {
            if (img.width == 200 && img.height == 50) {
              imgMode = true;
            }
          }

          resolve(imgMode);
        };
        img.src = fr.result + "";
      };
      fr.readAsDataURL(image);
    });
    return p;
  }

  getvimeoToken() {
    this.workbookService
      .getvimeoToken(this.selectedClientId)
      .subscribe((res: any) => {
        if (res.success) {
          this.vimeoDetails = res.data;
        }
      });
  }

  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async uploadWorksheetMedia(event, flag) {
    if (flag) {
      if (
        event &&
        event.target.files[0] &&
        event.target.files[0].type.includes("image")
      ) {
        this.spinnerService.show();
        this.getImgResolution(event, "check for horizontal").then((res) => {
          if (res == true) {
            if (event.target.files && event.target.files.length >= 1) {
              for (let media of event.target.files) {
                if (media.type.includes("image")) {
                  let uploadData;
                  uploadData = new FormData();
                  uploadData.append("Image", media);
                  if (media.size >= 5242880) {
                    this.spinnerService.hide();
                    this.toastr.error(
                      this.appService.getTranslation(
                        "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                      ),
                      this.appService.getTranslation("Utils.error")
                    );
                  } else {
                    this.workbookService
                      .uploadDiwoMedia(uploadData)
                      .subscribe((res: any) => {
                        this.spinnerService.hide();
                        if (res.success) {
                          this.selectedWorksheetErrorIndex = -1;
                          let worksheet =
                            this.worksheetList[this.selectedWorksheetIndex];
                          worksheet.isMediaSelected = false;
                          this.worksheetDetail.DiwoAssets[0] = {
                            path:
                              res.data.media_path + res.data.Image[0].filename,
                            type: "Image",
                            fileName: res.data.Image[0].originalname,
                            forBrief: false,
                          };
                          this.cancelMediaPopUp();
                        }
                      });
                  }
                }
              }
            } else if (event.target.files && event.target.files.length == 1) {
              let type;
              if (event.target.files[0].type.includes("video")) {
                type = "Video";
              } else if (event.target.files[0].type.includes("image")) {
                type = "Image";
              } else {
                type = "Document";
              }

              let uploadData;
              uploadData = new FormData();
              uploadData.append(type, event.target.files[0]);
              if (event.target.files[0].size >= 5242880) {
                this.spinnerService.hide();
                this.toastr.error(
                  this.appService.getTranslation(
                    "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                  ),
                  this.appService.getTranslation("Utils.error")
                );
              } else {
                this.workbookService
                  .uploadDiwoMedia(uploadData)
                  .subscribe((res: any) => {
                    this.spinnerService.hide();
                    if (res.success) {
                      let worksheet =
                        this.worksheetList[this.selectedWorksheetIndex];
                      worksheet.isMediaSelected = false;
                      this.worksheetDetail.DiwoAssets.push({
                        path: res.data.media_path + res.data.Image[0].filename,
                        type: type,
                        fileName: res.data.Image[0].originalname,
                        forBrief: false,
                      });
                      this.cancelMediaPopUp();
                    }
                  });
              }
            }
          } else {
            this.spinnerService.hide();
            this.toastr.warning(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.uploadthumbnail16:9"
              ),
              this.appService.getTranslation("Utils.warning")
            );
          }
          this.worksheet_thumbnail = undefined;
          $("#workbookMediaPopUpModel").modal("hide");
        });
        this.spinnerService.hide();
      } else {
        let selectedMediaAssetDetails = [];
        if (
          event.target &&
          event.target.files &&
          event.target.files.length > 0
        ) {
          for (let media of event.target.files) {
            let fileName = media.name;
            let mediaType = media.type;
            fileName = fileName.replace(".mp4", "");
            if (mediaType.includes("video")) {
              mediaType = "Video";
            }
            let payload = {
              title: fileName,
              type: mediaType,
              otherDetails: media,
              size: media.size,
            };
            selectedMediaAssetDetails.push(payload);
          }

          this.toastr.success(
            this.appService.getTranslation(
              "Pages.Workbook.AddEdit.Toaster.vimeovideouploading"
            ),
            this.appService.getTranslation("Utils.success")
          );

          for (let asset of selectedMediaAssetDetails) {
            if (asset.type == "Video") {
              this.spinnerService.show();
              if (asset) {
                this.spinnerService.show();
                if (this.appService?.configurable_feature?.mediaCMS) {
                  ////////////////////////////////////////////////////////////////////////////////////////
                  const uploadData = new FormData();
                  for (var key in asset) {
                    if (key == "otherDetails") {
                      uploadData.append(asset.type, asset[key]);
                    } else {
                      if (key != "Preview") {
                        uploadData.append(key, asset[key]);
                      }
                    }
                  }

                  let uploadVideoWorksheetIndex = this.selectedWorksheetIndex;
                  this.workbookService
                    .canUploadVideoOnMediaCMS()
                    .subscribe((res: any) => {
                      if (res.success) {
                        if (res.canUpload) {
                          this.workbookService
                            .uploadVideoOnMediaCMS(
                              uploadData,
                              this.selectedClientId
                            )
                            .subscribe({
                              next: (event: HttpEvent<any>) => {
                                if (
                                  event.type === HttpEventType.UploadProgress &&
                                  event.total
                                ) {
                                  const percentDone = Math.round(
                                    (event.loaded / event.total) * 100
                                  );
                                  this.worksheetList[
                                    uploadVideoWorksheetIndex
                                  ].worksheetUploadProgress = percentDone;

                                  if (
                                    uploadVideoWorksheetIndex ==
                                    this.selectedWorksheetIndex
                                  ) {
                                    this.worksheetDetail.worksheetUploadProgress =
                                      percentDone;
                                  }
                                }

                                if (event.type === HttpEventType.Response) {
                                  const res = event.body;

                                  if (res) {
                                    let worksheet =
                                      this.worksheetList[
                                        this.selectedWorksheetIndex
                                      ];
                                    worksheet.isMediaSelected = false;

                                    asset.cmsVideoId = res.data.videoId;
                                    asset.MediaCMSUploadQueueId =
                                      res.data.MediaCMSUploadQueueId;

                                    asset.size = res.data.size;
                                    // this.worksheetDetail.DiwoAssets = [];
                                    this.worksheetList[
                                      uploadVideoWorksheetIndex
                                    ].DiwoAssets = [];

                                    if (this.beforeTranscodingFlag === false) {
                                      // this.worksheetDetail.DiwoAssets[0] = {
                                      //   path: null,
                                      //   type: "Video",
                                      //   fileName: res.data.filename,
                                      //   cmsVideoId: asset.cmsVideoId,
                                      //   Transcoding: false,
                                      //   isTranscoding: false,
                                      //   forBrief: false,
                                      // };

                                      this.worksheetList[
                                        uploadVideoWorksheetIndex
                                      ].DiwoAssets[0] = {
                                        path: null,
                                        type: "Video",
                                        fileName: res.data.filename,
                                        cmsVideoId: asset.cmsVideoId,
                                        Transcoding: false,
                                        isTranscoding: false,
                                        forBrief: false,
                                        MediaCMSUploadQueueId:
                                          asset.MediaCMSUploadQueueId,
                                        MediaUploadStatus: "queued",
                                      };

                                      if (
                                        uploadVideoWorksheetIndex ==
                                        this.selectedWorksheetIndex
                                      ) {
                                        this.worksheetDetail.DiwoAssets = [];

                                        this.worksheetDetail.DiwoAssets[0] = {
                                          path: null,
                                          type: "Video",
                                          fileName: res.data.filename,
                                          cmsVideoId: asset.cmsVideoId,
                                          Transcoding: false,
                                          isTranscoding: false,
                                          forBrief: false,
                                          MediaCMSUploadQueueId:
                                            asset.MediaCMSUploadQueueId,
                                          MediaUploadStatus: "queued",
                                        };
                                      }
                                    }

                                    this.spinnerService.hide();
                                    this.checkMediaCMSVideoTranscodingStatus();
                                  }
                                }
                              },
                            });
                        } else {
                          this.toastr.error(
                            this.appService.getTranslation(
                              "Pages.Workbook.AddEdit.diskfullTranscodingVideoText"
                            ),
                            this.appService.getTranslation("Utils.error")
                          );
                        }
                      } else {
                        this.toastr.error(
                          this.appService.getTranslation(
                            "Pages.Workbook.AddEdit.diskfullTranscodingVideoText"
                          ),
                          this.appService.getTranslation("Utils.error")
                        );
                      }
                    });
                } else if (this.appService?.configurable_feature?.vimeo) {
                  asset.data = null;
                  const options = {
                    token: this.vimeoDetails.vToken,
                    url: environment.VimeoUploadApi,
                    videoName: asset.title,
                    videoDescription: asset.description,
                  };
                  if (this.vimeoDetails == false) {
                    this.toastr.error(
                      this.appService.getTranslation(
                        "Utils.novimeocredentials"
                      ),
                      this.appService.getTranslation("Utils.error")
                    );
                    this.spinnerService.hide();
                    return;
                  }

                  this.workbookService
                    .createVimeo(options, asset.otherDetails.size)
                    .pipe(
                      map((data) => (asset.data = data)),
                      switchMap(() => {
                        this.workbookService.updateVimeoLink(asset.data.link);
                        if (
                          asset.data.upload.size === asset.otherDetails.size
                        ) {
                          return this.workbookService.vimeoUpload(
                            asset.data.upload.upload_link,
                            asset.otherDetails
                          );
                        }
                      })
                    )
                    .subscribe(
                      (event) => {
                        if (event.type === HttpEventType.UploadProgress) {
                          this.uploadPercent = Math.round(
                            (100 * event.loaded) / event.total
                          );
                        } else if (event instanceof HttpResponse) {
                          let worksheet =
                            this.worksheetList[this.selectedWorksheetIndex];
                          worksheet.isMediaSelected = false;
                          let vmoVideoId_ = this.getVimeoUserIdFromUrl(
                            asset.data.uri
                          );
                          asset.path = asset.data.player_embed_url;
                          asset.vmoVideoId = vmoVideoId_;
                          this.spinnerService.hide();
                          this.worksheetDetail.DiwoAssets = [];
                          this.worksheetDetail.DiwoAssets[0] = {
                            path: asset.data.player_embed_url,
                            type: "Video",
                            fileName: asset.data.name,
                            vmoVideoId: vmoVideoId_,
                            Transcoding: false,
                            isTranscoding: false,
                            forBrief: false,
                          };
                          this.checkVideoTranscodingStatus();

                          this.workbookService
                            .MoveAssetToFolder(
                              vmoVideoId_,
                              this.selectedClientId
                            )
                            .subscribe((res: any) => {
                              if (res.success) {
                                this.spinnerService.hide();
                              } else {
                                this.spinnerService.hide();
                              }
                            });
                          const options = {
                            token: this.vimeoDetails.vToken,
                            url: environment.VimeoPresetApi,
                            presetId: this.vimeoDetails.presetId,
                            videoId: asset.vmoVideoId,
                          };
                          this.workbookService
                            .applyEmbedPreset(options)
                            .subscribe((res: any) => {});
                        }
                      },
                      (error) => {
                        console.log("Upload Error:", error);
                      },
                      () => {
                        console.log("Upload done");
                      }
                    );
                }
              }
            }
          }
          this.cancelMediaPopUp();
        }
      }
    } else {
      if (event.name.indexOf(".mp4") != -1) {
        let payload = {
          fileId: event.id,
          name: event.name,
          assetType: "Video",
        };
        //For Video
        this.workbookService
          .checkAddDonwloadAssetFormGoogleDrive(payload)
          .subscribe((res: any) => {
            if (res.success) {
              this.worksheetDetail.DiwoAssets = [];
              this.worksheetDetail.DiwoAssets.push({
                path: res.data.path,
                type: "Video",
                fileName: res.data.name,
                vmoVideoId: res.data.vmoVideoId,
                Transcoding: false,
                forBrief: false,
              });

              if (this.appService?.configurable_feature?.vimeo) {
                this.checkVideoTranscodingStatus();
              }

              this.workbookService
                .MoveAssetToFolder(res.data.vmoVideoId, this.selectedClientId)
                .subscribe((res: any) => {
                  if (res.success) {
                    this.spinnerService.hide();
                  } else {
                    this.spinnerService.hide();
                  }
                });
              const options = {
                token: this.vimeoDetails.vToken,
                url: environment.VimeoPresetApi,
                presetId: this.vimeoDetails.presetId,
                videoId: res.data.vmoVideoId,
              };
              this.workbookService
                .applyEmbedPreset(options)
                .subscribe((res: any) => {});
              this.cancelMediaPopUp();
            }
          });
      } else {
        let payload = {
          fileId: event.id,
          name: event.name,
          assetType: "Image",
        };
        this.workbookService
          .checkAddDonwloadAssetFormGoogleDrive(payload)
          .subscribe((res: any) => {
            this.spinnerService.hide();
            if (res.success) {
              this.worksheetDetail.DiwoAssets = [];
              this.worksheetDetail.DiwoAssets.push({
                path: res.data.path,
                type: "Image",
                fileName: res.data.fileName,
                forBrief: false,
              });
              this.cancelMediaPopUp();
            }
          });
      }
    }
  }

  async uploadWorksheetBrief(event, type) {
    if (event.target.files && event.target.files.length > 0) {
      for (let media of event.target.files) {
        let fileType = "Video";
        if (media.type.includes("image")) {
          if (media.size >= 5242880) {
            this.spinnerService.hide();
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.maxImageSize"
              ),
              this.appService.getTranslation("Utils.error")
            );
          }
          fileType = "Image";
        } else if (media.type.includes("application")) {
          if (media.size >= 10485760) {
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.maxDocumentSize"
              ),
              this.appService.getTranslation("Utils.error")
            );
          }
          fileType = "Document";
        } else if (media.type.includes("audio") && type == "Offline Task") {
          fileType = "Audio";
        } else if (media.type.includes("video")) {
          if (media.size >= 104857600) {
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.maxVideoSize"
              ),
              this.appService.getTranslation("Utils.error")
            );
          }
          fileType = "Video";
        }
        // if (fileType != 'Video') {
        let uploadData;
        uploadData = new FormData();
        uploadData.append(fileType, media);

        this.workbookService
          .uploadDiwoMedia(uploadData)
          .subscribe((res: any) => {
            this.spinnerService.hide();
            if (res.success) {
              if (fileType == "Image") {
                this.worksheetDetail.briefFiles.push({
                  path: res.data.media_path + res.data.Image[0].filename,
                  type: fileType,
                  fileName: res.data.Image[0].originalname,
                  forBrief: true,
                  // isAttachFile: true,
                });
              } else if (fileType == "Document") {
                this.worksheetDetail.briefFiles.push({
                  path: res.data.media_path + res.data.Document[0].filename,
                  type: fileType,
                  fileName: res.data.Document[0].originalname,
                  forBrief: true,
                  // isAttachFile: true,
                });
              } else if (fileType == "Audio") {
                this.worksheetDetail.briefFiles.push({
                  path: res.data.media_path + res.data.Audio[0].filename,
                  type: fileType,
                  fileName: res.data.Audio[0].originalname,
                  forBrief: true,
                  // isAttachFile: true,
                });
              } else if (fileType == "Video") {
                this.worksheetDetail.briefFiles.push({
                  path: res.data.media_path + res.data.Video[0].filename,
                  type: fileType,
                  fileName: res.data.Video[0].originalname,
                  forBrief: true,
                  // isAttachFile: true,
                });
              }
            }
          });
        // }
        // } else if (media.type.includes('video')) {
        //     let fileName = media.name;
        //     let mediaType = media.type;
        //     let asset;
        //     fileName = fileName.replace('.mp4', '');
        //     if (mediaType.includes('video')) {
        //         mediaType = 'Video';
        //     }
        //     let payload = {
        //         title: fileName,
        //         type: mediaType,
        //         otherDetails: media,
        //         size: media.size,
        //     };
        //     asset = payload;

        //     asset.data = null;
        //     const options = {
        //         token: this.vimeoDetails.vToken,
        //         url: environment.VimeoUploadApi,
        //         videoName: asset.title,
        //         videoDescription: asset.description,
        //     };
        //     if (this.vimeoDetails == false) {
        //         this.toastr.error(
        //             this.appService.getTranslation('Utils.novimeocredentials'),
        //             this.appService.getTranslation('Utils.error')
        //         );
        //         return;
        //     }
        //     this.spinnerService.show();

        //     this.workbookService.createVimeo(options, asset.otherDetails.size).pipe(map((data) => (asset.data = data)), switchMap(() => {
        //         this.workbookService.updateVimeoLink(asset.data.link);
        //         if (asset.data.upload.size === asset.otherDetails.size) {
        //             return this.workbookService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails
        //             );
        //         }
        //     })
        //     ).subscribe((event) => {
        //         if (event.type === HttpEventType.UploadProgress) {
        //             this.uploadPercent = Math.round(
        //                 (100 * event.loaded) /
        //                 event.total
        //             );
        //         } else if (
        //             event instanceof HttpResponse
        //         ) {
        //             let vmoVideoId_ =
        //                 this.getVimeoUserIdFromUrl(
        //                     asset.data.uri
        //                 );
        //             asset.path = asset.data.player_embed_url;
        //             asset.vmoVideoId = vmoVideoId_;
        //             this.spinnerService.hide();
        //             this.worksheetDetail.briefFiles.push({
        //                 path: asset.data.player_embed_url,
        //                 type: 'Video',
        //                 fileName: asset.data.name,
        //                 vmoVideoId: vmoVideoId_,
        //                 Transcoding: false,
        //                 forBrief: true,
        //             });

        //             this.workbookService.MoveAssetToFolder(vmoVideoId_, this.userClientId).subscribe((res: any) => {
        //                 if (res.success) {
        //                     this.spinnerService.hide();
        //                 } else {
        //                     this.spinnerService.hide();
        //                 }
        //             });
        //         }
        //     },
        //         (error) => {
        //             console.log('Upload Error:', error);
        //         },
        //         () => {
        //             console.log('Upload done');
        //         }
        //     );
        // }
      }
    }
  }

  uploadPdf(event) {
    if (event.target.files && event.target.files.length > 0) {
      // Restrict to one PDF at a time
      if (this.worksheetDetail.pdfFiles.length > 0) {
        this.toastr.warning("Pages.Workbook.AddEdit.Toaster.OnePdfUpload");
        return;
      }

      const media = event.target.files[0]; // Pick only the first file

      // Check if the selected file is a PDF
      if (!media.type.includes("application/pdf")) {
        this.toastr.error(
          this.appService.getTranslation(
            "Pages.Workbook.AddEdit.Toaster.invalidFileType"
          ),
          this.appService.getTranslation("Utils.error")
        );
        return;
      }

      // Check file size (max: 10MB)
      // if (media.size >= 10485760) {
      // 10.5 mb
      if (media.size >= 11010048) {
        this.toastr.error(
          this.appService.getTranslation(
            "Pages.Workbook.AddEdit.Toaster.maxDocumentSize"
          ),
          this.appService.getTranslation("Utils.error")
        );
        return;
      }

      let uploadData = new FormData();
      uploadData.append("Document", media);

      // Show spinner before upload starts
      this.spinnerService.show();

      this.workbookService.uploadDiwoMedia(uploadData).subscribe(
        (res: any) => {
          this.spinnerService.hide();

          if (res.success && res.data?.Document?.length > 0) {
            // ✅ Store the uploaded PDF
            this.worksheetDetail.pdfFiles = [
              {
                // Only allow one PDF
                path: res.data.media_path + res.data.Document[0].filename,
                type: "Document",
                fileName: res.data.Document[0].originalname,
                isPdf: true,
              },
            ];

            console.log("Updated PDF file:", this.worksheetDetail.pdfFiles);
          } else {
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.uploadFailed"
              ),
              this.appService.getTranslation("Utils.error")
            );
          }
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error(
            this.appService.getTranslation(
              "Pages.Workbook.AddEdit.Toaster.uploadError"
            ),
            this.appService.getTranslation("Utils.error")
          );
          console.error("Upload error:", error);
        }
      );
    }
  }

  // Cancel Function (Removes Uploaded PDF)
  cancelPdf() {
    if (!this.isviewMode) {
      this.worksheetDetail.pdfFiles = []; // Reset PDF list
      this.toastr.success("PDF removed. You can upload a new one.");
    }
  }

  deleteWorksheetThumbnail(source?: string) {
    if (!this.isviewMode) {
      this.worksheetDetail.DiwoAssets = [];
      this.worksheetDetail.worksheetUploadProgress = 0;
      //video is not yet transcoded and we had click on delete media
      if (source === "isNotTranscodedYet") {
        console.log("Triggered before transcoding");
        // this.beforeTranscodingFlag = true;
      }
    }
  }

  showWorkbookMediaPopUp() {
    $("#workbookMediaPopUpModel").modal("show");
  }

  cancelWorkbookMediaPopUp() {
    $("#workbookMediaPopUpModel").modal("hide");
  }

  showUploadImagePopup(questionIndex, optionIndex, isQuestion) {
    this.imgQuestionIndex = questionIndex;
    this.imgOptionIndex = optionIndex;
    this.imgIsquestion = isQuestion;
    $("#addImageModel").modal("show");
  }

  deleteWSMedia(index) {
    this.worksheetDetail.DiwoAssets.splice(index, 1);
  }

  getVimeoUserIdFromUrl(url) {
    const parts = url.split("/");
    return parts.at(-1);
  }

  uploadImage(event, flag) {
    if (!this.isviewMode) {
      if (flag) {
        if (
          event &&
          event.target.files[0] &&
          event.target.files[0].type.includes("image")
        ) {
          this.spinnerService.show();
          this.getImgResolution(event, "check for horizontal").then((res) => {
            if (res == true) {
              if (event.target.files && event.target.files.length > 1) {
                for (let media of event.target.files) {
                  if (media.type.includes("image")) {
                    let uploadData;
                    uploadData = new FormData();
                    uploadData.append("Image", media);
                    if (media.size >= 5242880) {
                      this.toastr.error(
                        this.appService.getTranslation(
                          "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                        ),
                        this.appService.getTranslation("Utils.error")
                      );
                      this.spinnerService.hide();
                    } else {
                      this.workbookService
                        .uploadDiwoMedia(uploadData)
                        .subscribe((res: any) => {
                          this.spinnerService.hide();
                          if (res.success) {
                            this.workbookForm.controls["DiwoAssets"].setValue([
                              {
                                path:
                                  res.data.media_path +
                                  res.data.Image[0].filename,
                                type: "Image",
                                fileName: res.data.Image[0].originalname,
                              },
                            ]);
                          }
                          this.cancelMediaPopUp();
                        });
                    }
                  }
                }
              } else if (event.target.files && event.target.files.length == 1) {
                let type;
                if (event.target.files[0].type.includes("video")) {
                  type = "Video";
                } else if (event.target.files[0].type.includes("image")) {
                  type = "Image";
                } else {
                  type = "Document";
                }

                let uploadData;
                uploadData = new FormData();
                uploadData.append(type, event.target.files[0]);
                if (event.target.files[0].size >= 5242880) {
                  this.toastr.error(
                    this.appService.getTranslation(
                      "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                    ),
                    this.appService.getTranslation("Utils.error")
                  );
                  this.cancelMediaPopUp();
                  this.spinnerService.hide();
                } else {
                  this.workbookService
                    .uploadDiwoMedia(uploadData)
                    .subscribe((res: any) => {
                      this.spinnerService.hide();
                      if (res.success) {
                        this.workbookForm.controls["DiwoAssets"].setValue([
                          {
                            path:
                              res.data.media_path + res.data.Image[0].filename,
                            type: type,
                            fileName: res.data.Image[0].originalname,
                          },
                        ]);
                      }
                      this.cancelMediaPopUp();
                    });
                }
              }
            } else {
              this.spinnerService.hide();
              this.toastr.warning(
                this.appService.getTranslation(
                  "Pages.Workbook.AddEdit.Toaster.uploadthumbnail16:9"
                ),
                this.appService.getTranslation("Utils.warning")
              );
            }
            this.workbook_thumbnail = undefined;
          });
        }
      } else {
        let payload = {
          fileId: event.id,
          name: event.name,
          assetType: "Image",
        };
        this.workbookService
          .checkAddDonwloadAssetFormGoogleDrive(payload)
          .subscribe((res: any) => {
            this.spinnerService.hide();
            if (res.success) {
              this.workbookForm.controls["DiwoAssets"].setValue([
                {
                  path: res.data.path,
                  type: "Image",
                  fileName: res.data.fileName,
                },
              ]);
              this.workbook_thumbnail = undefined;
              this.cancelMediaPopUp();
            }
          });
      }
    }
  }

  clearWorkbookThubnail() {
    if (!this.isviewMode) {
      this.workbookForm.controls["DiwoAssets"].setValue(null);
    }
  }

  cancel() {
    $("#addImageModel").modal("hide");
    this.imgQuestionIndex = null;
    this.imgOptionIndex = null;
    this.imgIsquestion = null;
  }

  selectCorrectAnser(questionIndex, OptionIndex) {
    this.worksheetDetail.Questions[questionIndex].Options[
      OptionIndex
    ].isCorrectAnswer =
      !this.worksheetDetail.Questions[questionIndex].Options[OptionIndex]
        .isCorrectAnswer;

    this.worksheetDetail.Questions[questionIndex].isAnswerSelected = false;

    // for (let question of this.worksheetDetail.Questions) {
    // 	for (let option of question.Options) {
    // 		option.isAnswerSelected = false;
    // 	}
    // }
  }

  cancelImage(questionIndex, OptionIndex, isQuestion) {
    if (!this.isviewMode) {
      if (isQuestion) {
        this.worksheetDetail.Questions[questionIndex].DiwoAssets = [];
      } else {
        this.worksheetDetail.Questions[questionIndex].Options[
          OptionIndex
        ].assetPath = null;
        this.worksheetDetail.Questions[questionIndex].Options[
          OptionIndex
        ].assetName = null;
        this.worksheetDetail.Questions[questionIndex].Options[
          OptionIndex
        ].assetType = null;
      }
    }
  }

  cancelBrief(index) {
    if (!this.isviewMode) {
      this.worksheetDetail.briefFiles.splice(index, 1);
    }
  }
  // showCollaboratePopUp() {
  //     $("#collaborateModel").modal('show');
  // }

  cancelCollaboratePopUp() {
    $("#collaborateModel").modal("hide");
  }

  submitCollaborate() {
    $("#collaborateModel").modal("hide");
  }

  changeAssignTab() {
    this.showAssignLearner = !this.showAssignLearner;
  }

  addMultipleOption() {
    this.worksheetDetail.Questions[0].Options = [];
    for (let i = 1; i <= this.worksheetDetail.Questions[0].answerCount; i++) {
      this.worksheetDetail.Questions[0].Options.push({
        text: null,
        assetPath: null,
        assetName: null,
        assetType: null,
        isCorrectAnswer: false,
        isOptionSelected: false,
        characterRemainsForOption: null,
      });
    }
  }

  cancelWorksheet(index) {
    const i = this.worksheetList.indexOf(index);
    if (i > -1) {
      this.worksheetList.splice(i, 1);
    }
  }

  cancelPdfToImagePopUp() {
    $("#confirmPdfToImageModal").modal("hide");
    this.uploadDataToConvertImage = null;
  }

  showPdfToImageUploadPopUp() {
    if (!this.isviewMode) {
      $("#confirmPdfToImageModal").modal("show");
    }
  }

  convertPdfToImages(event) {
    $("#confirmPdfToImageModal").modal("hide");
    this.value = undefined;
    this.uploadDataToConvertImage = new FormData();
    this.uploadDataToConvertImage.append("PDF", event.target.files[0]);
    let filename = event.target.files[0].name.replace(".pdf", "");
    this.workbookForm.controls["title"].setValue(filename);
    this.spinnerService.show();
    this.workbookService
      .convertPDFToImages(this.uploadDataToConvertImage)
      .subscribe((res: any) => {
        if (res.success) {
          if (res.data && res.data.length > 0) {
            if (this.worksheetList.length == 1) {
              if (
                this.worksheetList[0].DiwoAssets.length == 0 &&
                this.worksheetList[0].description == null &&
                this.worksheetList[0].briefFiles.length == 0 &&
                this.worksheetList[0].brief == null
              ) {
                this.worksheetList = [];
              }
            }

            for (let asset of res.data) {
              let payload = {
                id: null,
                worksheetUploadProgress: 0,
                description: null,
                showTrainerInstrution: false,
                trainerInst: null,
                type: "Learning Content",
                thumbnailPath: null,
                flgVerify: false,
                flgFav: true,
                flgBookmark: false,
                flgImp: false,
                flgGroupActivty: false,
                chart: "Learning Content",
                DiwoAssets: [
                  {
                    path: asset.path,
                    type: "Image",
                    fileName: asset.fileName,
                    forBrief: false,
                  },
                ],
                isGraded: true,
                publishResult: true,
                anonymous: false,
                trainerSurvey: false,
                trainerSurveyComp: false,
                isMediaSelected: false,
                brief: null,
                briefFiles: [],
                sessionFeedback: false,
                sessionFeedBackMinCount: 1,
                sessionFeedBackMaxCount: 5,
                question_Group: false,
                questionGroups: [],
                quizRandCount: 1,
                isquizrandomised: false,
                activityTemplate: "Learning Content",
                charRemainsForactivityTemplate: null,
                noOfTimeSpinWheel: 1,
                noOfQuesForCategory: 0,
                showQueCategory: false,
                spinWheelQueCategory: [],
                isGeoTagSelected: false,
                trainerSurveyDisable: false,
                keepSurveyOn: false,
                keepSurveyOnDays: null,
                mediaWorkSheet: false,
                mediaProfilesData: [],
                isAssessment: false,
                isPdf: false,
                isInteractivePdf: false,
                // isAttachFile: false,
                isShowScore: true,
                timeToShowOption: "Upon Submission",
                videoComplition: this.videoComplition,
                isQuizCompletion: this.isQuizCompletion,
                maxReAttemptsAllowed: this.maxReAttemptsAllowed,
                GuideId: null,
                isGuideWorksheet: false,
                certificateData: {
                  maxMark: 0,
                  passingMarks: null,
                  condition: "",
                },
                Questions: [
                  {
                    question: null,
                    quizUploadProgress: 0,
                    DiwoAssets: [],
                    questionType: "MCQ",
                    SurveyRatingType: "Text",
                    characterRemainsForMinLable: null,
                    characterRemainsForMaxLable: null,
                    userRatingArray: [],
                    ratingMinLabel: null,
                    ratingMaxLabel: null,
                    selectAnswer: false,
                    answerCount: 1,
                    isQuestionSelected: false,
                    isQuestionTypeSelected: false,
                    characterRemainsForQuestion: null,
                    characterRemainsForGeoTag: null,
                    allowFileTypes: [],
                    fileSize: "2 MB",
                    numberOfFiles: 1,
                    isTextResponse: true,
                    isFileSubmission: false,
                    multipleOption: false,
                    isAnswerSelected: false,
                    surveyMinScale: 1,
                    surveyMaxScale: 5,
                    group_index: null,
                    spinCatIndex: null,
                    spinQueScore: 0,
                    isSpinQueScore: false,
                    Options: [
                      {
                        text: null,
                        assetPath: null,
                        assetName: null,
                        assetType: null,
                        isCorrectAnswer: false,
                        isOptionSelected: false,
                        characterRemainsForOption: null,
                      },
                    ],
                  },
                ],
              };

              let questionGroups = {
                index: 0,
                group_name: null,
              };
              payload.questionGroups.push(questionGroups);

              let spinWheelQueCategory = {
                category_index: 1,
                category_name: null,
                totalquestion: 0,
                totalscore: 0,
                characterRemain: 0,
              };

              payload.spinWheelQueCategory.push(spinWheelQueCategory);

              if (this.worksheetList.length <= 300) {
                this.worksheetList.push(payload);
              } else {
                this.toastr.warning(
                  this.appService.getTranslation(
                    "Pages.Workbook.AddEdit.Toaster.PdfImportMax300"
                  ),
                  this.appService.getTranslation("Utils.warning")
                );
              }
            }

            this.toastr.success(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.PdfImport"
              ),
              this.appService.getTranslation("Utils.success")
            );
            this.spinnerService.hide();
          }
        }
      });
  }

  selectServeyType(data, index) {
    if (data.no == 4) {
      if (this.worksheetDetail.sessionFeedback) {

        console.log('sessionFeedBackMaxCount', this.worksheetDetail.sessionFeedBackMaxCount);

        this.worksheetDetail.Questions[index].surveyMaxScale =
          this.worksheetDetail.sessionFeedBackMaxCount;
        this.worksheetDetail.Questions[index].surveyMinScale =
          this.worksheetDetail.sessionFeedBackMinCount;

        this.worksheetDetail.Questions[index].userRatingArray = [];
        for (
          let i = 0;
          i < this.worksheetDetail.Questions[index].surveyMaxScale;
          i++
        ) {
          this.worksheetDetail.Questions[index].userRatingArray.push(i);
        }

        this.worksheetDetail.Questions[index].Options = [];

        for (
          let i = 0;
          i < this.worksheetDetail.Questions[index].surveyMaxScale;
          i++
        ) {
          this.worksheetDetail.Questions[index].Options.push({
            text: null,
            assetPath: null,
            assetName: null,
            assetType: null,
            isCorrectAnswer: false,
            isOptionSelected: false,
            characterRemainsForOption: null,
          });
        }
      } else {
        console.log(
          "this.worksheetDetail.Questions in selectServeyType",
          this.worksheetDetail.Questions
        );

        this.worksheetDetail.Questions[index].userRatingArray = []; // Reset the array
        for (
          let i = 0;
          i < this.worksheetDetail.Questions[index].surveyMaxScale;
          i++
        ) {
          this.worksheetDetail.Questions[index].userRatingArray.push(i);

          console.log(
            "this.worksheetDetail.Questions[index].userRatingArray",
            this.worksheetDetail.Questions[index].userRatingArray
          );
        }

        this.worksheetDetail.Questions[index].Options = [];
        for (let i = 0; i < this.optionCountForRatingScale; i++) {
          this.worksheetDetail.Questions[index].Options.push({
            text: null,
            assetPath: null,
            assetName: null,
            assetType: null,
            isCorrectAnswer: false,
            isOptionSelected: false,
            characterRemainsForOption: null,
          });
        }
      }
    }

    //check survey geo tag type selected or not
    if (this.worksheetDetail.Questions.length > 0) {
      for (let question of this.worksheetDetail.Questions) {
        if (question.questionType == "Geo Tag") {
          this.worksheetDetail.isGeoTagSelected = true;
          this.worksheetDetail.trainerSurveyDisable = true;
        } else {
          this.worksheetDetail.isGeoTagSelected = false;
          this.worksheetDetail.trainerSurveyDisable = false;
        }
      }
    }
  }

  onSelectAnswer(questionIndex) {
    if (!this.isviewMode) {
      this.worksheetDetail.Questions[questionIndex].selectAnswer = true;
      this.scrollList = document.getElementById(
        "Question_scroll_Index" + questionIndex
      );
      this.scrollList.scrollIntoView({ behavior: "smooth" });
    }
  }

  cancelWB() {
    localStorage.setItem("isRedirectAllowed", "true");
    this.router.navigate(["module"]);
  }

  selectClient() {
    if (this.selectedClientId) {
      this.getvimeoToken();
      this.getCourseList();
      $("#selecteClientList").modal("hide");
    }
  }

  selctedClient(event) {
    this.ownerClient = {
      name: event.name,
      client_id: event.client_id,
    };
  }

  checkVideoTranscodingStatus() {
    if (this.checkVideoTranscodingInterval) {
      clearInterval(this.checkVideoTranscodingInterval);
    }
    if (this.vimeoDetails) {
      let videoCount = 0;
      for (let ws of this.worksheetList) {
        if (
          ws &&
          ws.DiwoAssets &&
          ws.DiwoAssets.length > 0 &&
          ws.DiwoAssets[0].type == "Video" &&
          (ws.DiwoAssets[0].Transcoding == false ||
            ws.DiwoAssets[0].isTranscoding == false)
        ) {
          videoCount++;
        }
      }

      if (videoCount > 0) {
        let count = 0;
        let convertedDoneCount = 0;
        this.checkVideoTranscodingInterval = setInterval(() => {
          count++;
          for (let ws of this.worksheetList) {
            if (
              ws &&
              ws.DiwoAssets &&
              ws.DiwoAssets.length > 0 &&
              ws.DiwoAssets[0].type == "Video" &&
              (ws.DiwoAssets[0].Transcoding == false ||
                ws.DiwoAssets[0].isTranscoding == false)
            ) {
              let videoCode = ws.DiwoAssets[0].vmoVideoId;
              const options = {
                token: this.vimeoDetails.vToken,
              };
              this.workbookService
                .checkVimeoVideoTranscodingStatus(videoCode, options)
                .subscribe((res: any) => {
                  if (res) {
                    if (
                      res &&
                      res.transcode &&
                      res.transcode.status.toLowerCase() == "complete"
                    ) {
                      convertedDoneCount++;
                      ws.DiwoAssets[0].isTranscoding = true;
                      ws.DiwoAssets[0].Transcoding == true;
                    }
                  }
                });
            }
          }
          if (convertedDoneCount >= videoCount || count > 25) {
            clearInterval(this.checkVideoTranscodingInterval);
          }
        }, 5000);
      }
    }
  }

  checkVideoTranscodingStatusForQuestion() {
    if (this.checkVideoTranscodingIntervalForQuestion) {
      clearInterval(this.checkVideoTranscodingIntervalForQuestion);
    }
    if (this.vimeoDetails) {
      let videoCount = 0;
      for (let ws of this.worksheetList) {
        if (ws.Questions && ws.Questions.length > 0) {
          for (let question of ws.Questions) {
            for (let asset of question.DiwoAssets) {
              if (
                asset &&
                asset.type == "Video" &&
                asset.vmoVideoId &&
                (asset.Transcoding == false || asset.isTranscoding == false)
              ) {
                videoCount++;
              }
            }
          }
        }
      }

      if (videoCount > 0) {
        let count = 0;
        let convertedDoneCount = 0;
        this.checkVideoTranscodingIntervalForQuestion = setInterval(() => {
          count++;
          for (let ws of this.worksheetList) {
            if (ws.Questions && ws.Questions.length > 0) {
              for (let question of ws.Questions) {
                for (let asset of question.DiwoAssets) {
                  if (
                    asset &&
                    asset.type == "Video" &&
                    asset.vmoVideoId &&
                    (asset.Transcoding == false || asset.isTranscoding == false)
                  ) {
                    let videoCode = asset.vmoVideoId;
                    const options = {
                      token: this.vimeoDetails.vToken,
                    };
                    this.workbookService
                      .checkVimeoVideoTranscodingStatus(videoCode, options)
                      .subscribe((res: any) => {
                        if (res) {
                          if (
                            res &&
                            res.transcode &&
                            res.transcode.status.toLowerCase() == "complete"
                          ) {
                            convertedDoneCount++;
                            asset.Transcoding = true;
                            asset.isTranscoding = true;
                          }
                        }
                      });
                  }
                }
              }
            }
          }
          if (convertedDoneCount >= videoCount || count > 25) {
            clearInterval(this.checkVideoTranscodingIntervalForQuestion);
          }
        }, 5000);
      }
    }
  }

  ///////////////////////////////////////////////////////////  Media CMS Transcoding ////////////////////////////////////

  checkMediaCMSVideoTranscodingStatus() {
    if (this.checkMediaCMSVideoTranscodingInterval) {
      clearInterval(this.checkMediaCMSVideoTranscodingInterval);
    }

    if (this.vimeoDetails) {
      let videoCount = 0;
      for (let ws of this.worksheetList) {
        if (
          ws &&
          ws.DiwoAssets &&
          ws.DiwoAssets.length > 0 &&
          ws.DiwoAssets[0].type == "Video" &&
          (ws.DiwoAssets[0]?.Transcoding == false ||
            ws.DiwoAssets[0]?.isTranscoding == false)
        ) {
          videoCount++;
        }
      }
      console.log(
        "---------checkMediaCMSVideoTranscodingStatus-----4---",
        videoCount
      );
      if (videoCount > 0) {
        let count = 0;
        let convertedDoneCount = 0;
        this.checkMediaCMSVideoTranscodingInterval = setInterval(() => {
          console.log("----------setInterval-------");
          if (this.checkPreviousWorksheetTrancoding == false) {
            count++;
            let payload = {
              // credentailId: this.vimeoDetails.id,
              MediaCMSUploadQueueIds: [],
            };
            for (let ws of this.worksheetList) {
              if (
                ws &&
                ws.DiwoAssets &&
                ws.DiwoAssets.length > 0 &&
                ws.DiwoAssets[0].type == "Video" &&
                ws.DiwoAssets[0].MediaCMSUploadQueueId &&
                (ws.DiwoAssets[0].Transcoding == false ||
                  ws.DiwoAssets[0].isTranscoding == false)
              ) {
                payload.MediaCMSUploadQueueIds.push(
                  ws.DiwoAssets[0].MediaCMSUploadQueueId
                );
                // const payload = {
                // 	credentailId: this.vimeoDetails.id,
                // 	cmsVideoId: ws.DiwoAssets[0].cmsVideoId,
                // };
                // this.workbookService.checkMediaCMSVideoTranscodingStatus(payload).subscribe((res: any) => {
                // 	if (res.success) {
                // 		if (res.data && res.data.isTranscoding && res.data.path) {
                // 			convertedDoneCount++;
                // 			ws.DiwoAssets[0].isTranscoding = true;
                // 			ws.DiwoAssets[0].Transcoding = true;
                // 			ws.DiwoAssets[0].path = res.data.path;
                // 		}
                // 	}
                // });
              }
            }
            console.log("-------payload-----", payload);
            if (payload.MediaCMSUploadQueueIds.length > 0) {
              this.checkPreviousWorksheetTrancoding = true;

              this.workbookService
                .checkMediaCMSVideoTranscodingStatus(payload)
                .subscribe((res: any) => {
                  if (res.success) {
                    this.checkPreviousWorksheetTrancoding = false;
                    if (res.data.length > 0) {
                      const videoMap = new Map(
                        res.data.map((video) => [
                          video.MediaCMSUploadQueueId,
                          video,
                        ])
                      );
                      this.worksheetList = this.worksheetList.map(
                        (worksheet) => {
                          if (worksheet?.DiwoAssets?.length > 0) {
                            worksheet.DiwoAssets = worksheet.DiwoAssets.map(
                              (asset) => {
                                const videoDetails: any = videoMap.get(
                                  asset?.MediaCMSUploadQueueId
                                );
                                console.log("--videoDetails-", videoDetails);
                                if (
                                  videoDetails?.isTranscoding &&
                                  videoDetails?.path
                                ) {
                                  convertedDoneCount++;
                                  asset.cmsVideoId = videoDetails.cmsVideoId;
                                  asset.MediaCMSUploadQueueId =
                                    videoDetails.MediaCMSUploadQueueId;
                                  asset.Transcoding = true;
                                  asset.isTranscoding = true;
                                  asset.path = videoDetails.path;
                                }
                                asset.MediaUploadStatus =
                                  videoDetails?.MediaUploadStatus;
                                return asset;
                              }
                            );
                          }
                          return worksheet;
                        }
                      );
                    }
                  } else {
                    this.checkPreviousWorksheetTrancoding = false;
                  }
                });
            } else {
              this.checkPreviousWorksheetTrancoding = false;
            }
            if (
              convertedDoneCount >= videoCount ||
              count > 60 ||
              payload.MediaCMSUploadQueueIds.length == 0
            ) {
              clearInterval(this.checkMediaCMSVideoTranscodingInterval);
            }
          }
        }, 15000);
      }
    }
  }

  checkMediaCMSVideoTranscodingStatusForQuestion() {
    if (this.checkMediaCMSVideoTranscodingIntervalForQuestion) {
      clearInterval(this.checkMediaCMSVideoTranscodingIntervalForQuestion);
    }
    if (this.vimeoDetails) {
      let videoCount = 0;
      for (let ws of this.worksheetList) {
        if (ws.Questions && ws.Questions.length > 0) {
          for (let question of ws.Questions) {
            for (let asset of question.DiwoAssets) {
              if (
                asset &&
                asset.type == "Video" &&
                asset.MediaCMSUploadQueueId &&
                (asset.Transcoding == false || asset.isTranscoding == false)
              ) {
                videoCount++;
              }
            }
          }
        }
      }

      console.log("-videoCount1-", videoCount);
      if (videoCount > 0) {
        let count = 0;
        let convertedDoneCount = 0;
        this.checkMediaCMSVideoTranscodingIntervalForQuestion = setInterval(
          () => {
            console.log("---setInterval-----");
            if (this.checkPreviousQuestionsTrancoding == false) {
              count++;
              let payload = {
                // credentailId: this.vimeoDetails.id,
                MediaCMSUploadQueueIds: [],
              };
              for (let ws of this.worksheetList) {
                if (ws.Questions && ws.Questions.length > 0) {
                  for (let question of ws.Questions) {
                    for (let asset of question.DiwoAssets) {
                      if (
                        asset &&
                        asset.type == "Video" &&
                        asset.MediaCMSUploadQueueId &&
                        (asset.Transcoding == false ||
                          asset.isTranscoding == false)
                      ) {
                        payload.MediaCMSUploadQueueIds.push(
                          asset.MediaCMSUploadQueueId
                        );
                        // const payload = {
                        // 	credentailId: this.vimeoDetails.id,
                        // 	cmsVideoId: asset.cmsVideoId,
                        // };
                        // this.workbookService.checkMediaCMSVideoTranscodingStatus(payload).subscribe((res: any) => {
                        // 	if (res.success) {
                        // 		if (res.data && res.data.isTranscoding && res.data.path) {
                        // 			convertedDoneCount++;
                        // 			asset.Transcoding = true;
                        // 			asset.isTranscoding = true;
                        // 			asset.path = res.data.path;
                        // 		}
                        // 	}
                        // });
                      }
                    }
                  }
                }
              }
              if (payload.MediaCMSUploadQueueIds.length > 0) {
                this.checkPreviousQuestionsTrancoding = true;
                this.workbookService
                  .checkMediaCMSVideoTranscodingStatus(payload)
                  .subscribe((res: any) => {
                    if (res.success) {
                      if (res.data.length > 0) {
                        this.checkPreviousQuestionsTrancoding = false;
                        const videoMap = new Map(
                          res.data.map((video) => [
                            video.MediaCMSUploadQueueId,
                            video,
                          ])
                        );
                        this.worksheetList = this.worksheetList.map(
                          (worksheet) => {
                            if (worksheet?.Questions.length > 0) {
                              worksheet.Questions = worksheet.Questions.map(
                                (question) => {
                                  if (question?.DiwoAssets.length > 0) {
                                    question.DiwoAssets =
                                      question.DiwoAssets.map((asset) => {
                                        const videoDetails: any = videoMap.get(
                                          asset?.MediaCMSUploadQueueId
                                        );
                                        if (
                                          videoDetails?.isTranscoding &&
                                          videoDetails?.path
                                        ) {
                                          convertedDoneCount++;
                                          asset.cmsVideoId =
                                            videoDetails.cmsVideoId;
                                          asset.MediaCMSUploadQueueId =
                                            videoDetails.MediaCMSUploadQueueId;
                                          asset.Transcoding = true;
                                          asset.isTranscoding = true;
                                          asset.path = videoDetails.path;
                                        }
                                        asset.MediaUploadStatus =
                                          videoDetails?.MediaUploadStatus;
                                        return asset;
                                      });
                                  }
                                  return question;
                                }
                              );
                            }
                            return worksheet;
                          }
                        );
                      }
                    } else {
                      this.checkPreviousQuestionsTrancoding = false;
                    }
                  });
              } else {
                this.checkPreviousQuestionsTrancoding = false;
              }
              if (
                convertedDoneCount >= videoCount ||
                count > 60 ||
                payload?.MediaCMSUploadQueueIds.length == 0
              ) {
                console.log("---clearInterval-----");
                this.checkPreviousQuestionsTrancoding = false;
                clearInterval(
                  this.checkMediaCMSVideoTranscodingIntervalForQuestion
                );
              }
            }
          },
          15000
        );
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  cancelMediaPopUp() {
    $("#selectMediaModel").modal("hide");
    this.spinnerService.hide();
  }

  changeAssetLibareTab(tab) {
    this.showAssetTab = tab;
  }

  logoutGoogleAccount() {
    this.workbookService.logoutGoogleAccount().subscribe((res: any) => {
      if (res.success) {
        this.appService.googleDriveLogin = false;
        this.toastr.success(
          this.appService.getTranslation(
            "Pages.Assets.AddEdit.Toaster.googlelogoutsuccessfully"
          ),
          this.appService.getTranslation("Utils.success")
        );
      }
    });
  }

  //<!--------------------------- Google Workspace Code ---------------------->
  // getGoogleAssetList(type) {
  // 	this.workbookService.getAllAssetsByTypeFromGooleDrive({ assetType: type }).subscribe((res: any) => {
  // 		if (res.success) {
  // 			this.assetListByGoogleDrive = [];
  // 			if (res?.data) {
  // 				this.appService.googleDriveLogin = true;
  // 				this.assetListByGoogleDrive = res.data.files;
  // 				for (let asset of this.assetListByGoogleDrive) {
  // 					asset.selected = false;
  // 				}
  // 			} else {
  // 				this.appService.googleDriveLogin = false;
  // 			}
  // 		}
  // 	});
  // }
  //<!--------------------------- Google Workspace Code ---------------------->
  gmailLogin() {
    const USER_ID = JSON.stringify({
      UserId: JSON.parse(localStorage.getItem("user")).user.id,
    });
    const redirectUrl = environment.authRedirectUrl;
    const clientId = environment.googleClientId;
    // const url = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&state=%7B%22UserId%22%3A${USER_ID}%7D&response_type=code&client_id=300693115665-3ij3n2n2hsjg0hj67snpl9c884jjhpm2.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3587%2Fv1%2Fsession%2Foauth%2Fgoogle`;
    const url = ` https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&access_type=offline&redirect_uri=${redirectUrl}&client_id=${clientId}&state=${USER_ID}`;
    window.open(url, "_self");
  }

  async selectAssetFromPopUp(
    type,
    selectedFor,
    questionIndex?,
    optionIndex?,
    isQuestion?
  ) {
    this.googleDriveAssetSelectedFor = selectedFor;
    this.imgQuestionIndex = questionIndex;
    this.imgOptionIndex = optionIndex;
    this.imgIsquestion = isQuestion;
    this.assetListByGoogleDrive = [];

    // <!--------------------------- Google Workspace Code ---------------------->
    // await this.getGoogleAssetList(type);
    // <!--------------------------- Google Workspace Code ---------------------->
    this.typeForSearch = type;
    console.log('this.typeForSearch', this.typeForSearch);
    $("#selectMediaModel").modal("show");

    console.log('googleDriveAssetSelectedFor', this.googleDriveAssetSelectedFor);
  }

  async selctedAssetFromPopUp(asset) {
    switch (this.googleDriveAssetSelectedFor) {      

      case "WORKBOOK THUMBNAIL":
        await this.uploadImage(asset, false);
        break;

      case "WORKSHEET THUMBNAIL":
        console.log("--asset-", asset);
        await this.uploadWorksheetMedia(asset, false);

        break;
      case "QUESTION ASSET":
        await this.uploadMedia(
          asset,
          this.imgQuestionIndex,
          null,
          this.imgIsquestion,
          false
        );
        break;
      case "OPTION ASSET":
        await this.uploadMedia(
          asset,
          this.imgQuestionIndex,
          this.imgOptionIndex,
          this.imgIsquestion,
          false
        );
        break;
    }
  }

  async uploadedAssetFromPopUp(asset) {
    switch (this.googleDriveAssetSelectedFor) {
      case "WORKBOOK THUMBNAIL":
        await this.uploadImage(asset, true);
        break;
      case "WORKSHEET THUMBNAIL":
        await this.uploadWorksheetMedia(asset, true);
        break;
      case "QUESTION ASSET":
        await this.uploadMedia(
          asset,
          this.imgQuestionIndex,
          null,
          this.imgIsquestion,
          true
        );
        break;
      case "OPTION ASSET":
        await this.uploadMedia(
          asset,
          this.imgQuestionIndex,
          this.imgOptionIndex,
          this.imgIsquestion,
          true
        );
        break;
    }
  }
  onChangeSurveyTrainer() {
    if (this.worksheetList[this.selectedWorksheetIndex].trainerSurvey) {
      this.worksheetList[this.selectedWorksheetIndex].question_Group = false;
      this.worksheetList[this.selectedWorksheetIndex].questionGroups = [];
    } else {
      this.addOneQuestionGroup();
    }

    if (!this.worksheetList[this.selectedWorksheetIndex].trainerSurvey) {
      this.worksheetList[this.selectedWorksheetIndex].isGeoTagSelected = false;
    } else {
      this.worksheetList[this.selectedWorksheetIndex].isGeoTagSelected = true;
    }
  }

  onChangeQuizGraded() {
    if (!this.worksheetList[this.selectedWorksheetIndex].isGraded) {
      this.worksheetList[this.selectedWorksheetIndex].isAssessment = false;
    }
  }

  showWorksheetBiggerPreview(img) {
    $("#worksheetBiggerPreview").modal("show");
    this.worksheetBiggerPreviewImg = img;
  }
  cancelBiggerPreview() {
    $("#worksheetBiggerPreview").modal("hide");
  }

  showWorkbookPreview() {
    window.open(`${this.viewWorkBookUrl}`, "_blank");
  }

  showWorksheetLeavePopUp() {
    if (!this.isviewMode && !this.showModuleTypeSelection) {
      $("#leaveworksheetPageModal").modal("show");
    } else {
      localStorage.setItem("isRedirectAllowed", "true");
      this.router.navigate(["module"]);
    }
  }

  cancelleaveworksheetPage() {
    $("#leaveworksheetPageModal").modal("hide");
  }

  leaveworksheetPage() {
    localStorage.setItem("isRedirectAllowed", "true");
    $("#leaveworksheetPageModal").modal("hide");
    this.router.navigate(["module"]);
  }

  downloadbulkUploadWorksheetTemplate(): string {
    switch (this.selectedModuleType) {
      case 1:
        return "assets/file/Upload_bulk_worksheets_ILT.xlsx";
      case 2:
        return "assets/file/Upload_bulk_worksheets_VBT.xlsx";
      case 4:
        return "assets/file/Upload_bulk_worksheets_WT.xlsx";
      default:
        return "#"; // fallback or disable link
    }
  }

  bulkUploadWorksheet(event) {
    this.excelWorksheetUpload = undefined;
    let file = event.target.files[0];
    let allWorksheets = [];
    if (file) {
      this.isBulkuploadStarted = true;
      this.toastr.warning(
        this.appService.getTranslation(
          "Pages.Workbook.AddEdit.Toaster.bulkworksheetStart"
        ),
        this.appService.getTranslation("Utils.warning")
      );

      const uploadData = new FormData();
      uploadData.append("file", file);
      this.workbookService
        .bulkUploadWorksheet(uploadData, this.selectedModuleType)
        .subscribe(
          (res: any) => {
            if (res.data && res.data !== null) {
              if (this.worksheetList.length == 1) {
                if (
                  this.worksheetList[0].DiwoAssets.length == 0 &&
                  this.worksheetList[0].description == null &&
                  this.worksheetList[0].briefFiles.length == 0 &&
                  this.worksheetList[0].brief == null
                ) {
                  this.worksheetList = [];
                }
              }

              allWorksheets = [];
              if (res.data && res.data.LcontentList.length > 0) {
                allWorksheets.push(...res.data.LcontentList);
              }

              if (
                res.data &&
                res.data.discussionList.length > 0 &&
                this.selectedModuleType == 1
              ) {
                allWorksheets.push(...res.data.discussionList);
              }

              if (res.data && res.data.quizList.length > 0) {
                allWorksheets.push(...res.data.quizList);
              }

              if (res.data && res.data.pollList.length > 0) {
                allWorksheets.push(...res.data.pollList);
              }

              if (
                res.data &&
                res.data.wordCloudList.length > 0 &&
                this.selectedModuleType == 1
              ) {
                allWorksheets.push(...res.data.wordCloudList);
              }

              if (res.data && res.data.surveyList.length > 0) {
                allWorksheets.push(...res.data.surveyList);
              }

              if (res.data && res.data.offlineList.length > 0) {
                allWorksheets.push(...res.data.offlineList);
              }

              if (res.data && res.data.spinTheWheelList.length > 0) {
                allWorksheets.push(...res.data.spinTheWheelList);
              }

              allWorksheets = [...allWorksheets];
              this.worksheetUploadErrorArray = [];
              let count = 0;
              for (let worksheet_ of allWorksheets) {
                let error;
                if (worksheet_.errorMsg) {
                  error = worksheet_.errorMsg.split(",");
                  let payload = {
                    type: worksheet_.type,
                    description: worksheet_.description
                      ? worksheet_.description
                      : null,
                    errorMessageArray: error,
                  };

                  payload.errorMessageArray = [
                    ...new Set(payload.errorMessageArray),
                  ];
                  this.worksheetUploadErrorArray.push(payload);

                  if (this.worksheetUploadErrorArray.length > 0) {
                    this.showWorksheetErrorPopup();
                  }
                } else {
                  let worksheet_payload = {
                    id: null,
                    worksheetUploadProgress: 0,
                    description: worksheet_.description
                      ? worksheet_.description
                      : null,
                    showTrainerInstrution: false,
                    trainerInst: worksheet_.trainerInst
                      ? worksheet_.trainerInst
                      : null,
                    type: worksheet_.type,
                    thumbnailPath: null,
                    flgVerify: false,
                    flgFav: true,
                    flgBookmark: false,
                    flgImp: worksheet_.flgImp ? worksheet_.flgImp : false,
                    flgGroupActivty: worksheet_.flgGroupActivty
                      ? worksheet_.flgGroupActivty
                      : false,
                    chart: worksheet_.chart ? worksheet_.chart : null,
                    DiwoAssets: [],
                    isGraded: worksheet_.isGraded ? worksheet_.isGraded : false,
                    isAssessment: worksheet_.isAssessment
                      ? worksheet_.isAssessment
                      : false,
                    publishResult: worksheet_.publishResult
                      ? worksheet_.publishResult
                      : false,
                    isShowScore: worksheet_.isShowScore
                      ? worksheet_.isShowScore
                      : false,
                    timeToShowOption: worksheet_.timeToShowOption
                      ? worksheet_.timeToShowOption
                      : "Upon Submission",
                    anonymous: worksheet_.anonymous
                      ? worksheet_.anonymous
                      : false,
                    trainerSurvey: worksheet_.trainerSurvey
                      ? worksheet_.trainerSurvey
                      : false,
                    trainerSurveyComp: worksheet_.trainerSurveyComp
                      ? worksheet_.trainerSurveyComp
                      : false,
                    isMediaSelected: false,
                    brief: worksheet_.brief ? worksheet_.brief : null,
                    briefFiles: [],
                    sessionFeedback: worksheet_.sessionFeedback
                      ? worksheet_.sessionFeedback
                      : false,
                    sessionFeedBackMinCount: 1,
                    sessionFeedBackMaxCount: 5,
                    group_name: worksheet_.group_name
                      ? worksheet_.group_name
                      : null,
                    question_Group: worksheet_.question_Group
                      ? worksheet_.question_Group
                      : false,
                    questionGroups: [],
                    quizRandCount: worksheet_.quizRandCount
                      ? worksheet_.quizRandCount
                      : 1,
                    isquizrandomised: false,
                    activityTemplate: worksheet_.activityTemplate
                      ? worksheet_.activityTemplate
                      : worksheet_.type,
                    charRemainsForactivityTemplate:
                      this.maxLengthForctivityTemplate -
                      (worksheet_ && worksheet_.activityTemplate
                        ? worksheet_.activityTemplate.length
                        : 0),
                    noOfTimeSpinWheel: worksheet_.noOfTimeSpinWheel
                      ? parseInt(worksheet_.noOfTimeSpinWheel)
                      : 1,
                    noOfQuesForCategory: worksheet_.noOfQuesForCategory
                      ? worksheet_.noOfQuesForCategory
                      : 1,
                    showQueCategory: worksheet_.showQueCategory
                      ? worksheet_.showQueCategory
                      : false,
                    spinWheelQueCategory: [],
                    isGeoTagSelected: false,
                    keepSurveyOn: worksheet_.keepSurveyOn
                      ? worksheet_.keepSurveyOn
                      : false,
                    keepSurveyOnDays: worksheet_.keepSurveyOnDays
                      ? worksheet_.keepSurveyOnDays
                      : null,
                    mediaWorkSheet: worksheet_.mediaWorkSheet
                      ? worksheet_.mediaWorkSheet
                      : false,
                    mediaProfilesData: [],
                    isGuideWorksheet: worksheet_.isGuideWorksheet
                      ? worksheet_.isGuideWorksheet
                      : false,
                    certificateData: {
                      maxMark: 0,
                      passingMarks: null,
                      condition: "",
                    },
                    Questions: [],
                    worksheetNo: worksheet_.worksheetNo
                      ? worksheet_.worksheetNo
                      : null,
                  };

                  if (worksheet_payload.type == "Learning Content") {
                    worksheet_payload.chart = "Learning Content";
                  }

                  if (worksheet_payload.type == "Discussion") {
                    worksheet_payload.chart = "Discussion";
                  }

                  if (worksheet_payload.type == "Follow Us") {
                    worksheet_payload.chart = "Learning Content";
                  }

                  if (worksheet_payload.type == "Quiz") {
                    worksheet_payload.chart = "Bar";
                    worksheet_payload.isAssessment =
                      worksheet_.isGraded && worksheet_.isAssessment
                        ? worksheet_.isAssessment
                        : false;
                    worksheet_payload.publishResult =
                      worksheet_.isGraded && worksheet_.publishResult
                        ? worksheet_.publishResult
                        : false;
                  }

                  if (worksheet_payload.type == "Quiz (Randomised)") {
                    worksheet_payload.isquizrandomised = true;
                    worksheet_payload.chart = "Bar";
                    worksheet_payload.isAssessment =
                      worksheet_.isGraded && worksheet_.isAssessment
                        ? worksheet_.isAssessment
                        : false;
                    worksheet_payload.publishResult =
                      worksheet_.isGraded && worksheet_.publishResult
                        ? worksheet_.publishResult
                        : false;
                  }

                  if (worksheet_payload.type == "Word Cloud") {
                    worksheet_payload.chart = "Word Cloud";
                  }

                  if (worksheet_payload.type == "Survey") {
                    worksheet_payload.chart = "Survey";
                  }

                  if (worksheet_payload.type == "Offline Task") {
                    worksheet_payload.chart = "Offline Task";
                  }

                  if (worksheet_payload.type == "Spin The Wheel") {
                    worksheet_payload.chart = "Bar";

                    if (
                      worksheet_ &&
                      worksheet_.spinWheelQueCategory &&
                      worksheet_.spinWheelQueCategory.length > 0
                    ) {
                      for (let cat of worksheet_.spinWheelQueCategory) {
                        worksheet_payload.spinWheelQueCategory = [
                          ...worksheet_payload.spinWheelQueCategory,
                          {
                            category_index: cat.category_index,
                            category_name: cat.category_name,
                            totalquestion: cat.totalquestion,
                            totalscore: cat.totalscore,
                            characterRemain: cat.characterRemain,
                          },
                        ];
                      }
                    } else {
                      worksheet_payload.questionGroups = [
                        ...worksheet_payload.questionGroups,
                        {
                          category_index: 1,
                          category_name: null,
                          totalquestion: 0,
                          totalscore: 0,
                          characterRemain: 0,
                        },
                      ];
                    }
                  }

                  if (
                    worksheet_ &&
                    worksheet_.questionGroups &&
                    worksheet_.questionGroups.length > 0
                  ) {
                    let groupCount = 0;
                    for (let group of worksheet_.questionGroups) {
                      worksheet_payload.questionGroups = [
                        ...worksheet_payload.questionGroups,
                        {
                          index: groupCount++,
                          group_name: group,
                        },
                      ];
                    }
                  } else {
                    worksheet_payload.questionGroups = [
                      ...worksheet_payload.questionGroups,
                      {
                        index: count++,
                        group_name: null,
                      },
                    ];
                  }

                  if (worksheet_.Questions) {
                    let questions = JSON.parse(worksheet_.Questions);
                    if (questions && questions.length > 0) {
                      count = 0;
                      for (let que of questions) {
                        if (que.Question.text) {
                          let targetIndex = -1;
                          if (
                            worksheet_payload.questionGroups &&
                            worksheet_payload.questionGroups.length > 0
                          ) {
                            targetIndex =
                              worksheet_payload.questionGroups.findIndex(
                                (group) =>
                                  group.group_name === que.Question.groupname
                              );
                          }

                          let quepayload = {
                            question: que.Question.text,
                            DiwoAssets: [],
                            questionType: que.Question.type
                              ? que.Question.type
                              : null,
                            selectAnswer: false,
                            answerCount: que.Question.answerCount
                              ? que.Question.answerCount
                              : 1,
                            isQuestionSelected: false,
                            isQuestionTypeSelected: false,
                            characterRemainsForQuestion: null,
                            characterRemainsForGeoTag: null,
                            allowFileTypes: [],
                            fileSize: "2 MB",
                            numberOfFiles: que.Question.numberOfFiles
                              ? JSON.parse(que.Question.numberOfFiles)
                              : 1,
                            isTextResponse: que.Question.isTextResponse
                              ? que.Question.isTextResponse
                              : false,
                            isFileSubmission: que.Question.isFileSubmission
                              ? que.Question.isFileSubmission
                              : false,
                            multipleOption: que.Question.multipleOption
                              ? que.Question.multipleOption
                              : false,
                            surveyCharcterLimit:
                              que.Question && que.Question.surveyCharcterLimit
                                ? JSON.parse(que.Question.surveyCharcterLimit)
                                : null,
                            isAnswerSelected: false,
                            surveyMinScale: 1,
                            surveyMaxScale: 5,
                            group_index: targetIndex,
                            spinCatIndex: que.Question.spinCatIndex
                              ? parseInt(que.Question.spinCatIndex)
                              : 0,
                            spinQueScore: que.Question.spinQueScore
                              ? parseInt(que.Question.spinQueScore)
                              : 0,
                            isSpinQueScore: false,
                            Options: [],
                            userRatingArray: [],
                          };

                          if (que.Question.allowFileTypes) {
                            quepayload.allowFileTypes =
                              que.Question.allowFileTypes.toString().split(",");
                          } else {
                            quepayload.allowFileTypes = [];
                          }

                          quepayload.characterRemainsForQuestion =
                            this.maxLengthForQuestion -
                            (quepayload && quepayload.question
                              ? quepayload.question.length
                              : 0);
                          quepayload.characterRemainsForGeoTag =
                            this.maxLengthForGeoTag -
                            (quepayload && quepayload.question
                              ? quepayload.question.length
                              : 0);

                          for (let opt of que.Options) {
                            let optpayload = {
                              text: opt.text,
                              assetPath: null,
                              assetName: null,
                              assetType: null,
                              isCorrectAnswer: opt.isCurrectAnswer,
                              isOptionSelected: false,
                              characterRemainsForOption: null,
                            };

                            optpayload.characterRemainsForOption =
                              this.maxLengthForOption -
                              (optpayload.text ? optpayload.text.length : 0);

                            quepayload.Options.push(optpayload);
                          }

                          if (que.Question.type == "Rating scale") {
                            que.Question.userRatingArray = [];
                            for (
                              let i = 0;
                              i < que.Question.surveyMaxScale;
                              i++
                            ) {
                              que.Question.userRatingArray.push(i);
                            }

                            quepayload.userRatingArray =
                              que.Question.userRatingArray;

                            let addOPtionCont;
                            if (quepayload.Options.length < 5) {
                              addOPtionCont = 5 - quepayload.Options.length;
                            }

                            if (addOPtionCont) {
                              for (let i = 0; i < addOPtionCont; i++) {
                                let optpayload = {
                                  text: null,
                                  assetPath: null,
                                  assetName: null,
                                  assetType: null,
                                  isCorrectAnswer: false,
                                  isOptionSelected: false,
                                  characterRemainsForOption: null,
                                };
                                quepayload.Options.push(optpayload);
                              }
                            }
                          }

                          worksheet_payload.Questions.push(quepayload);
                          count++;
                        }
                      }
                    }
                  }

                  if (worksheet_.type == "Spin The Wheel") {
                    if (
                      worksheet_payload.spinWheelQueCategory &&
                      worksheet_payload.spinWheelQueCategory.length > 0
                    ) {
                      worksheet_payload.spinWheelQueCategory =
                        worksheet_payload.spinWheelQueCategory.map((item) => ({
                          ...item,
                          disabled:
                            item.totalquestion >=
                            worksheet_payload.noOfQuesForCategory,
                        }));
                    }
                  }

                  console.log("-worksheet_payload-", worksheet_payload);
                  this.worksheetList.push(worksheet_payload);
                }
              }

              console.log("-this.worksheetList- 0", this.worksheetList);

              if (this.worksheetList.length > 0) {
                const output: any[] = [];
                const unindexed: any[] = [];

                // Step 1: Place items with worksheetNo in correct positions
                for (let i = 0; i < this.worksheetList.length; i++) {
                  const item = this.worksheetList[i];
                  if (
                    item.worksheetNo !== null &&
                    item.worksheetNo !== undefined &&
                    !isNaN(item.worksheetNo)
                  ) {
                    const index = Number(item.worksheetNo) - 1;
                    output[index] = item;
                  } else {
                    unindexed.push(item);
                  }
                }

                // Step 2: Fill undefined slots with unindexed items
                for (
                  let i = 0, j = 0;
                  i < output.length && j < unindexed.length;
                  i++
                ) {
                  if (!output[i]) {
                    output[i] = unindexed[j++];
                  }
                }

                // Step 3: Append remaining unindexed (if any)
                for (let i = 0; i < unindexed.length; i++) {
                  if (!output.includes(unindexed[i])) {
                    output.push(unindexed[i]);
                  }
                }

                // Replace the original array with the sorted one
                this.worksheetList = output;
              }

              console.log("-this.worksheetList-1", this.worksheetList);
            }
            this.isBulkuploadStarted = false;
            this.toastr.success(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.bulkworksheetuploaded"
              ),
              this.appService.getTranslation("Utils.success")
            );
          },
          (error) => {
            this.isBulkuploadStarted = false;
            this.toastr.error(
              this.appService.getTranslation("Utils.somthingwentwrong"),
              this.appService.getTranslation("Utils.error")
            );
            console.log("Rejected", error);
          }
        );
    } else {
      this.toastr.error(this.appService.getTranslation("Utils.invalidfile"));
    }
  }

  showWorksheetErrorPopup() {
    $("#errorworksheetPageModal").modal("show");
  }

  cancelleaveworksheetErrorPage() {
    $("#errorworksheetPageModal").modal("hide");
  }

  //social Media worksheet add and remove
  addSocialmediaWorksheet() {
    if (this.workbookForm.value.isMediaWorksheet) {
      this.addWorkSheet(true);
      if (this.appBranding && this.appBranding.allSocialMediaData) {
        console.log("--appBranding-", this.appBranding);
        let mediaProfilesData = JSON.parse(this.appBranding.allSocialMediaData);
        let count = 0;
        for (let appmedia of mediaProfilesData) {
          let payload = {
            index: count,
            mediaName: appmedia.mediaName,
            mediaLink: appmedia.mediaLink,
            mediaHandle: appmedia.mediaHandle,
            isClick: false,
            date: null,
            isPlatformError: false,
            isPlatformURLError: false,
            isPlatformURLValidError: false,
          };
          this.worksheetDetail.mediaProfilesData.push(payload);
          count++;
        }

        this.worksheetDetail.mediaProfilesData = [
          ...this.worksheetDetail.mediaProfilesData,
        ];
        console.log("-this.worksheetDetail-", this.worksheetDetail);
      } else {
        this.addOneMediaProfile();
      }
    } else {
      for (let i = 0; i < this.worksheetList.length; i++) {
        if (this.worksheetList[i].mediaWorkSheet) {
          if (this.worksheetList.length > 1) {
            this.worksheetList.splice(i, 1);
          } else {
            this.toastr.warning(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.atleastoneworksheet"
              ),
              this.appService.getTranslation("Utils.warning")
            );
          }
        }
      }
    }
  }

  addOneMediaProfile() {
    let flag = false;
    if (this.worksheetDetail.mediaProfilesData.length > 0) {
      for (let item of this.worksheetDetail.mediaProfilesData) {
        if (item.mediaName == "" || item.mediaName == null) {
          flag = true;
          item.isPlatformError = true;
        }
        if (item.mediaLink == "" || item.mediaLink == null) {
          flag = true;
          item.isPlatformURLError = true;
        }

        if (item.isDuplicatePlateForm || item.isPlatformURLValidError) {
          flag = true;
        }
      }

      this.allMediaProfile = [...this.allMediaProfile];
    }
    if (!flag) {
      this.worksheetDetail.mediaProfilesData = [
        ...this.worksheetDetail.mediaProfilesData,
        {
          index: 0,
          mediaName: null,
          mediaLink: null,
          mediaHandle: null,
          isClick: false,
          date: null,
          isPlatformError: false,
          isPlatformURLError: false,
          isPlatformURLValidError: false,
          isDuplicatePlateForm: false,
        },
      ];
      this.increaseCountForMediaProfile();
    }
  }

  removeMediaProfile(index) {
    this.allMediaProfile = [...this.allMediaProfile];
    this.worksheetDetail.mediaProfilesData.splice(index, 1);
    this.worksheetDetail.mediaProfilesData = [
      ...this.worksheetDetail.mediaProfilesData,
    ];
    this.increaseCountForMediaProfile();
  }

  increaseCountForMediaProfile() {
    let count = 0;
    if (this.worksheetDetail.mediaProfilesData.length > 1) {
      for (let item of this.worksheetDetail.mediaProfilesData) {
        count++;
        item.index = count;
      }
    }
  }

  isDuplicatePlateform(index: number, value: any): boolean {
    return this.worksheetDetail.mediaProfilesData.some(
      (item, i) => item.mediaName === value && i !== index
    );
  }

  onSelectPlatform(index, data: any) {
    this.worksheetDetail.mediaProfilesData[index].isPlatformError = false;
    // console.log('----duplicate---', this.isDuplicatePlateform(index, data.value));
    if (this.isDuplicatePlateform(index, data.value)) {
      this.worksheetDetail.mediaProfilesData[index].isDuplicatePlateForm = true;
    } else {
      this.worksheetDetail.mediaProfilesData[index].mediaName = data.value;
      this.worksheetDetail.mediaProfilesData[index].isDuplicatePlateForm =
        false;
    }

    // console.log('--mediaProfilesData--', this.worksheetDetail.mediaProfilesData);
  }

  onEnterPlatformLink(index, char) {
    this.worksheetDetail.mediaProfilesData[index].isPlatformURLError = false;
    if (char.toLowerCase().indexOf("http") == 0) {
      this.worksheetDetail.mediaProfilesData[index].isPlatformURLValidError =
        false;
    } else {
      this.worksheetDetail.mediaProfilesData[index].isPlatformURLValidError =
        true;
    }
  }

  // --------------------------------MODULES--------------------------
  getModulesList() {
    this.workbookService.getAllModulesTypes().subscribe((res: any) => {
      if (res.success) {
        this.allModuleList = [];
        this.allModuleList = res.data;      

        const fromIndex = this.allModuleList.findIndex(item => item.id === 5);
        const [itemToMove] = this.allModuleList.splice(fromIndex, 1);
        this.allModuleList.splice(2, 0, itemToMove);          
      }
    });
  }

  showModuleSelectionPopUp() {
    this.showModuleTypeSelection = true;
  }

 selectModuleType(item: any) {
    if (item.id != 3) {
        this.showModuleTypeSelection = false;
        this.selectedModuleType = item.id;  
    }
    if (item.id == 5) {                           
        localStorage.setItem("isRedirectAllowed", "true");
        this.router.navigate(['add-edit-scorm-module']);          
    }
}

  cancelModuleSelection() {
    localStorage.setItem("isRedirectAllowed", "true");
    this.router.navigate(["module"]);
  }

  // Cretificate Code
  async addCertificate() {
    await this.checkAssessment(true);
    this.showAddCerticiatePage = true;

    // if (this.workbookForm.value.haveCertificate && this.workbookForm.value.isAppliedCertificate) {
    // 	this.workbookForm.get('CertificateLine1').setValidators([Validators.required]);
    // 	this.workbookForm.get('CertificateLine2').setValidators([Validators.required]);
    // } else {
    // 	this.workbookForm.get('CertificateLine1').clearValidators();
    // 	this.workbookForm.get('CertificateLine2').clearValidators();
    // }

    if (this.badgesList.length == 0 || this.certificateList.length == 0) {
      this.workbookService.getAllBadgeAndCertificate().subscribe((res: any) => {
        if (res.success) {
          this.badgesList = res.data.badges;

          for (let item of res.data.badges) {
            if (
              item &&
              item.code &&
              this.appBranding &&
              this.appBranding.accent_color
            ) {
              item.code = item.code.replaceAll(
                "#6513e1",
                this.appBranding.accent_color
              );
              let finalIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
                item.code
              );
              item.finalIcon = finalIcon;
            }
          }
          this.certificateList = res.data.certificates;

          console.log("badgesList", this.badgesList);
          console.log("workbookForm", this.workbookForm.value);
        }
      });
    }
  }

  backPage() {
    if (this.stepCount == 1) {
      this.showAddCerticiatePage = false;
      this.stepCount = 1;
      return;
    }
    if (this.stepCount > 1) {
      this.stepCount--;
    }
  }

  nextPage() {
    for (let worksheet of this.worksheetList) {
      if (worksheet.isAssessment) {
        if (worksheet.certificateData) {
          if (
            worksheet.certificateData.passingMarks == null ||
            worksheet.certificateData.passingMarks <= 0 ||
            worksheet.certificateData.passingMarks >
              worksheet.certificateData.maxMark
          ) {
            //Error Please enter valid passing Marks
            this.toastr.error(
              this.appService.getTranslation(
                "Pages.Workbook.AddEdit.Toaster.validPassingMarks"
              ),
              this.appService.getTranslation("Utils.error")
            );
            return;
          }
        }
      }
    }

    if (!this.workbookForm.value.isAppliedCertificate) {
      if (this.stepCount == 2) {
        this.showAddCerticiatePage = false;
        this.stepCount = 1;
      }
      if (this.stepCount < 2) {
        this.stepCount++;
      }
    } else {
      if (this.stepCount < 3) {
        this.stepCount++;
      }
    }
  }

  checkAssessment(isEdit = false) {
    //Check in the Live editing Worksheets

    if (!isEdit) {
      if (this.worksheetDetail?.isAssessment === true) {
        this.showAddCertiifcateButton = true;

        let maxScore = 0;
        for (let question of this.worksheetDetail.Questions) {
          maxScore = maxScore + question.spinQueScore;
        }

        if (this.worksheetDetail.type == "Offline Task") {
          maxScore = this.worksheetDetail.Questions.length * 5;
        }

        this.worksheetDetail.certificateData = {
          maxMark: maxScore,
          passingMarks:
            this.worksheetDetail.certificateData &&
            this.worksheetDetail.certificateData.passingMarks > maxScore
              ? maxScore
              : this.worksheetDetail.certificateData.passingMarks,
          condition: "AND",
        };
      } else {
        this.showAddCertiifcateButton = false;
        if (this.worksheetDetail?.certificateData) {
        }
      }
      if (!this.showAddCertiifcateButton) {
        for (let i = 0; i < this.worksheetList.length; i++) {
          if (this.worksheetList[i]?.isAssessment == true) {
            this.showAddCertiifcateButton = true;
            let maxScore = 0;
            for (let question of this.worksheetDetail.Questions) {
              maxScore = maxScore + question.spinQueScore;
            }

            if (this.worksheetList[i].type == "Offline Task") {
              maxScore = this.worksheetDetail.Questions.length * 5;
            }
            this.worksheetList[i].certificateData.maxMark = maxScore;

            if (
              this.worksheetList[i].certificateData &&
              this.worksheetList[i].certificateData.passingMarks > maxScore
            ) {
              this.worksheetList[i].certificateData.passingMarks = maxScore;
            }
          }
        }
      }
      return;
    }

    if (isEdit) {
      for (let i = 0; i < this.worksheetList.length; i++) {
        if (this.worksheetList[i]?.isAssessment == true) {
          this.showAddCertiifcateButton = true;
          let maxScore = 0;
          for (let question of this.worksheetList[i].Questions) {
            maxScore = maxScore + question.spinQueScore;
          }
          if (this.worksheetList[i].type == "Offline Task") {
            maxScore = this.worksheetList[i].Questions.length * 5;
          }
          this.worksheetList[i].certificateData.maxMark = maxScore;
          if (this.worksheetList[i].certificateData.passingMarks > maxScore) {
            this.worksheetList[i].certificateData.passingMarks = maxScore;
          }
        }
      }
    }
  }

  checkPdf() {
    // if (this.worksheetDetail.isPdf) {
    //   // If PDF toggle is ON, turn OFF Attach File
    //   // this.worksheetDetail.isAttachFile = false;
    //   // this.workbookForm.controls["isAttachFile"].setValue(false);
    // }

    // Sync PDF toggle to form control
    this.workbookForm.controls["isInteractivePdf"].setValue(
      this.worksheetDetail.isPdf
    );
  }

  // checkAttachFile() {
  //   // if (this.worksheetDetail.isAttachFile) {
  //   //   // If Attach File toggle is ON, turn OFF PDF
  //   //   this.worksheetDetail.isPdf = false;
  //   //   this.workbookForm.controls["isInteractivePdf"].setValue(false);
  //   // }

  //   // Sync Attach File toggle to form control
  //   this.workbookForm.controls["isAttachFile"].setValue(
  //     this.worksheetDetail.isAttachFile
  //   );
  // }

  addOrRemoveCertificateAndCloseWindow(flag, type) {
    if (type == "save") {
      let saveflag = false;

      if (this.workbookForm.value.isAppliedCertificate) {
        if (
          this.workbookForm.value.CertificateLine1 == null ||
          this.workbookForm.value.CertificateLine1 == ""
        ) {
          this.workbookForm.controls["CertificateLine1"].setErrors({
            required: true,
          });
          this.workbookForm.controls["CertificateLine1"].markAsTouched({
            onlySelf: true,
          });
          saveflag = true;
        }

        if (
          this.workbookForm.value.CertificateLine2 == null ||
          this.workbookForm.value.CertificateLine2 == ""
        ) {
          this.workbookForm.controls["CertificateLine2"].setErrors({
            required: true,
          });
          this.workbookForm.controls["CertificateLine2"].markAsTouched({
            onlySelf: true,
          });
          saveflag = true;
        }
      }

      if (
        this.workbookForm.value.isAppliedCertificate &&
        this.workbookForm.value.isAddSignature
      ) {
        if (this.signatureAuthorityIndex == 2) {
          if (
            this.workbookForm.value.signatureName2 == null ||
            this.workbookForm.value.signatureName2 == ""
          ) {
            this.workbookForm.controls["signatureName2"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signatureName2"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }

          if (
            this.workbookForm.value.signatureName1 == null ||
            this.workbookForm.value.signatureName1 == ""
          ) {
            this.workbookForm.controls["signatureName1"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signatureName1"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }

          if (
            this.workbookForm.value.signaturePath2 == null ||
            this.workbookForm.value.signaturePath2 == ""
          ) {
            this.workbookForm.controls["signaturePath2"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signaturePath2"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }
          if (
            this.workbookForm.value.signaturePath1 == null ||
            this.workbookForm.value.signaturePath1 == ""
          ) {
            this.workbookForm.controls["signaturePath1"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signaturePath1"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }
        } else if (this.signatureAuthorityIndex == 1) {
          if (
            this.workbookForm.value.signatureName1 == null ||
            this.workbookForm.value.signatureName1 == ""
          ) {
            this.workbookForm.controls["signatureName1"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signatureName1"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }

          if (
            this.workbookForm.value.signaturePath1 == null ||
            this.workbookForm.value.signaturePath1 == ""
          ) {
            this.workbookForm.controls["signaturePath1"].setErrors({
              required: true,
            });
            this.workbookForm.controls["signaturePath1"].markAsTouched({
              onlySelf: true,
            });
            saveflag = true;
          }
        }
      }

      if (saveflag) {
        return;
      }
    }

    if (type != "back") {
      this.workbookForm.controls["haveCertificate"].setValue(flag);
    }

    this.showAddCerticiatePage = false;
    this.stepCount = 1;

    if (!flag && type == "remove") {
      this.workbookForm.controls["condition"].setValue("AND");
      this.workbookForm.controls["isAppliedBadge"].setValue(false);
      this.workbookForm.controls["isAppliedCertificate"].setValue(false);
      this.workbookForm.controls["haveCertificate"].setValue(false);
      this.workbookForm.controls["BadgeId"].setValue(null);
      this.workbookForm.controls["CertificateLine1"].setValue(null);
      this.workbookForm.controls["CertificateLine2"].setValue(null);
      this.workbookForm.controls["CertificateLine3"].setValue(null);
      this.workbookForm.controls["e_duration"].setValue(null);
      this.workbookForm.controls["l_outcomes"].setValue(null);

      this.workbookForm.controls["isAddSignature"].setValue(false);

      this.workbookForm.controls["signatureName1"].setValue(null);
      this.workbookForm.controls["signatureDesignation1"].setValue(null);
      this.workbookForm.controls["signaturePath1"].setValue(null);
      this.workbookForm.controls["signaturePathName1"].setValue(null);

      this.workbookForm.controls["signatureName2"].setValue(null);
      this.workbookForm.controls["signatureDesignation2"].setValue(null);
      this.workbookForm.controls["signaturePath2"].setValue(null);
      this.workbookForm.controls["signaturePathName2"].setValue(null);

      this.stepsBar = [1, 2];
      this.stepsBar = [...this.stepsBar];
    }
  }

  checkPassingMarks(worksheet) {
    if (
      worksheet.certificateData.maxMark < worksheet.certificateData.passingMarks
    ) {
      worksheet.certificateData.passingMarks = 0;
      this.toastr.error(
        this.appService.getTranslation(
          "Pages.Workbook.AddEdit.Toaster.passingmarkserror"
        ),
        this.appService.getTranslation("Utils.error")
      );
      return;
    }
  }

  preventNegative(event: any) {
    event.target.value = event.target.value.replace(/[^0-9]/g, "");
  }

  ///////////////////////  Certificate Signature Authority     ///////////////

  previewCertificate() {
    $("#certificatePreviewModal").modal("show");
  }

  cancelcertificatePreviewModal() {
    $("#certificatePreviewModal").modal("hide");
  }

  onChangeApplyCertificate() {
    if (!this.workbookForm.value.isAppliedCertificate) {
      this.workbookForm.controls["CertificateLine1"].setValue(null);
      this.workbookForm.controls["CertificateLine2"].setValue(null);
      this.workbookForm.controls["CertificateLine3"].setValue(null);

      this.workbookForm.controls["isAddSignature"].setValue(false);

      this.workbookForm.controls["signatureName1"].setValue(null);
      this.workbookForm.controls["signatureDesignation1"].setValue(null);
      this.workbookForm.controls["signaturePath1"].setValue(null);
      this.workbookForm.controls["signaturePathName1"].setValue(null);

      this.workbookForm.controls["signatureName2"].setValue(null);
      this.workbookForm.controls["signatureDesignation2"].setValue(null);
      this.workbookForm.controls["signaturePath2"].setValue(null);
      this.workbookForm.controls["signaturePathName2"].setValue(null);

      if (this.signatureAuthorityIndex > 1) {
        this.signatureAuthorityIndex--;
      }
    }

    if (this.workbookForm.value.isAppliedCertificate) {
      this.stepsBar = [1, 2, 3];
      this.stepsBar = [...this.stepsBar];
    } else {
      this.stepsBar = [1, 2];
      this.stepsBar = [...this.stepsBar];
    }
  }

  onChangeSignatureAuthority() {
    this.workbookForm.controls["signatureName1"].setValue(null);
    this.workbookForm.controls["signatureDesignation1"].setValue(null);
    this.workbookForm.controls["signaturePath1"].setValue(null);
    this.workbookForm.controls["signaturePathName1"].setValue(null);

    this.workbookForm.controls["signatureName2"].setValue(null);
    this.workbookForm.controls["signatureDesignation2"].setValue(null);
    this.workbookForm.controls["signaturePath2"].setValue(null);
    this.workbookForm.controls["signaturePathName2"].setValue(null);
    if (this.signatureAuthorityIndex > 1) {
      this.signatureAuthorityIndex--;
    }
  }

  uploadSignature(event: any, signature: any) {
    this.getImgResolution(event, "check for signature authority").then(
      (res) => {
        if (res == true) {
          if (
            event &&
            event.target.files[0] &&
            event.target.files[0].type.includes("image")
          ) {
            this.spinnerService.show();
            for (let media of event.target.files) {
              if (media.type.includes("image")) {
                let uploadData;
                uploadData = new FormData();
                uploadData.append("Image", media);
                if (media.size >= 5242880) {
                  this.toastr.error(
                    this.appService.getTranslation(
                      "Pages.Workbook.AddEdit.Toaster.maxImageSize"
                    ),
                    this.appService.getTranslation("Utils.error")
                  );
                  this.spinnerService.hide();
                } else {
                  this.workbookService
                    .uploadDiwoMedia(uploadData)
                    .subscribe((res: any) => {
                      this.spinnerService.hide();
                      if (res.success) {
                        if (signature == "uploadSignature1") {
                          this.workbookForm.controls["signaturePath1"].setValue(
                            res.data.media_path + res.data.Image[0].filename
                          );
                          this.workbookForm.controls[
                            "signaturePathName1"
                          ].setValue(res.data.Image[0].filename);
                          this.workbookForm.controls[
                            "signaturePath1"
                          ].setErrors(null);
                          this.workbookForm.controls[
                            "signaturePath1"
                          ].markAsTouched({
                            onlySelf: true,
                          });
                        } else if (signature == "uploadSignature2") {
                          this.workbookForm.controls["signaturePath2"].setValue(
                            res.data.media_path + res.data.Image[0].filename
                          );
                          this.workbookForm.controls[
                            "signaturePathName2"
                          ].setValue(res.data.Image[0].filename);
                          this.workbookForm.controls[
                            "signaturePath2"
                          ].setErrors(null);
                          this.workbookForm.controls[
                            "signaturePath2"
                          ].markAsTouched({
                            onlySelf: true,
                          });
                        }
                      }
                    });
                }
              }
            }
          }
        } else {
          this.spinnerService.hide();
          this.toastr.warning(
            this.appService.getTranslation(
              "Pages.Workbook.AddEdit.Toaster.uploadsignatureImage"
            ),
            this.appService.getTranslation("Utils.warning")
          );
        }
        this.workbook_thumbnail = undefined;
      }
    );

    this.cancelMediaPopUp();
  }

  AddSignatureAuthority(index, name) {
    if (!this.isviewMode) {
      if (this.signatureAuthorityIndex < 2) {
        this.signatureAuthorityIndex++;
      }
    }
  }

  cancelSignatureAuthority(index: any, name: any) {
    if (!this.isviewMode) {
      for (let i = index; i <= this.signatureAuthorityIndex; i++) {
        if (i == this.signatureAuthorityIndex && i > 1) {
          this.workbookForm.controls[`signatureName${i}`].setValue(null);
          this.workbookForm.controls[`signatureDesignation${i}`].setValue(null);
          this.workbookForm.controls[`signaturePath${i}`].setValue(null);
          this.workbookForm.controls[`signaturePathName${i}`].setValue(null);

          this.checkCharLimitForSignatureName(
            this.workbookForm.controls[`signatureName${i}`].value,
            `signatureName${i}`
          );

          this.checkCharLimitForSignatureDesignation(
            this.workbookForm.controls[`signatureDesignation${i}`].value,
            `signatureDesignation${i}`
          );
        } else {
          this.workbookForm.controls[`signatureName${i}`].setValue(
            this.workbookForm.controls[`signatureName${i + 1}`].value
          );
          this.workbookForm.controls[`signatureDesignation${i}`].setValue(
            this.workbookForm.controls[`signatureDesignation${i + 1}`].value
          );
          this.workbookForm.controls[`signaturePath${i}`].setValue(
            this.workbookForm.controls[`signaturePath${i + 1}`].value
          );
          this.workbookForm.controls[`signaturePathName${i}`].setValue(
            this.workbookForm.controls[`signaturePathName${i + 1}`].value
          );

          this.workbookForm.controls[`signatureName${i + 1}`].setValue(null);
          this.workbookForm.controls[`signatureDesignation${i + 1}`].setValue(
            null
          );
          this.workbookForm.controls[`signaturePath${i + 1}`].setValue(null);
          this.workbookForm.controls[`signaturePathName${i + 1}`].setValue(
            null
          );

          this.checkCharLimitForSignatureName(
            this.workbookForm.controls[`signatureName${i}`].value,
            `signatureName${i}`
          );

          this.checkCharLimitForSignatureDesignation(
            this.workbookForm.controls[`signatureDesignation${i}`].value,
            `signatureDesignation${i}`
          );
        }

        if (this.signatureAuthorityIndex > 1) {
          this.signatureAuthorityIndex--;
        }
      }
    }
  }

  deleteSignatureImage(index: any, imagePath: any) {
    if (index == 1) {
      this.workbookForm.controls["signaturePath1"].setValue(null);
      this.workbookForm.controls["signaturePathName1"].setValue(null);
    } else if (index == 2) {
      this.workbookForm.controls["signaturePath2"].setValue(null);
      this.workbookForm.controls["signaturePathName2"].setValue(null);
    }
  }

  checkCharLimitForCertificateLine(val, type) {
    let len;
    if (val != null) {
      len = val.length;
    } else {
      len = 0;
    }

    if (type == "CertificateLine1") {
      this.charRemainsForCertificateLine1 =
        this.maxlengthForCertificateLine1 - len;
    } else if (type == "CertificateLine2") {
      this.charRemainsForCertificateLine2 =
        this.maxlengthForCertificateLine2 - len;
    } else if (type == "CertificateLine3") {
      this.charRemainsForCertificateLine3 =
        this.maxlengthForCertificateLine3 - len;
    }
  }

  checkCharLimitForSignatureName(val, type) {
    let len;
    if (val != null) {
      len = val.length;
    } else {
      len = 0;
    }

    if (type == "signatureName1") {
      this.charRemainsForSignatureName1 = this.maxlengthForSignatureName1 - len;
    } else if (type == "signatureName2") {
      this.charRemainsForSignatureName2 = this.maxlengthForSignatureName2 - len;
    }
  }

  checkCharLimitForSignatureDesignation(val, type) {
    let len;
    if (val != null) {
      len = val.length;
    } else {
      len = 0;
    }

    if (type == "signatureDesignation1") {
      this.charRemainsForSignatureDesignation1 =
        this.maxlengthForSignatureDesignation1 - len;
    } else if (type == "signatureDesignation2") {
      this.charRemainsForSignatureDesignation2 =
        this.maxlengthForSignatureDesignation2 - len;
    }
  }

  getGuideList() {
    this.workbookService.getGuideList().subscribe((res: any) => {
      if (res.success && res?.data?.length > 0) {
        this.guideList = res.data;
      } else {
        this.guideList = [];
      }
    });
  }

  selectWorksheetGuide(event: any, index: any) {
    if (this.worksheetDetail.GuideId) {
      this.worksheetDetail.isGuideWorksheet = true;
    } else {
      this.worksheetDetail.isGuideWorksheet = false;
    }
  }

  updateRatingLabels(questionIndex) {
    const question = this.worksheetDetail.Questions[questionIndex];
    if (question.questionType === "Rating scale") {
      let minLabel: string | null = null;
      let maxLabel: string | null = null;

      for (let op of question.Options) {
        const trimmedText = op.text?.trim();
        if (trimmedText) {
          if (minLabel === null) {
            minLabel = trimmedText;
          }
          maxLabel = trimmedText;
        }
      }

      question.ratingMinLabel = minLabel;
      question.ratingMaxLabel = maxLabel;
    }
  }
}
