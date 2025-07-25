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
import { ManageAddEditScormWorkbookService } from "./add-edit-scorm-workbook.service";
import { environment } from "../../../environments/environment";
import { AppService } from "../../app.service";
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
  selector: "app-add-edit-scorm-workbook",
  templateUrl: "./add-edit-scorm-workbook.component.html",
  styleUrls: ["./add-edit-scorm-workbook.component.css"],
  viewProviders: [DragulaService],
})
export class AddEditScromWorkbookComponent implements OnInit {
  workbookForm: any;
  showWorkbookDetails: boolean = true;
  appBranding: any;
  selectedClientId: any;
  userDetails: any;
  userRoleId: number;
  editWorkbook: any;
  notOwnAnyAssetRoleId = [2, 3, 4, 5];
  assetBasePath = environment.imageHost + environment.imagePath;
  viewWorkBookUrl: string;
  clientList: any[];
  selectedClient: any;
  guideList = [];
  workbook_thumbnail: any;
  SCORM_package_thumbnail: any;
  scromFileUploadProgress: number = 0;
  
  allModuleList = [];
  showModuleTypeSelection = false;
  selectedModuleType = 5;

  maxLengthForModuleTitle = 72;
  characterRemainsForModuleTitle = null;

  maxLengthForModuleDescription = 430;
  characterRemainsForModuleDescription = null;

  typeForSearch;
  assetListByGoogleDrive = [];
  imgQuestionIndex: any;
  googleDriveAssetSelectedFor: any;
  showAssetTab = 1;
  imgOptionIndex: any;
  imgIsquestion: any;

  isviewMode: boolean = false;

  iconObject = {
    delete_icon_primary_24: null,
    delete_icon_primary_27_30: null,
    logout_icon: null,
    content_copy: null,
    add_icon_30: null,
    workbook_setup_icon: null,
    download_fill: null,
    info_icon_25: null,
    back_arrow_icon: null,
    search_loader_preview: null,
    module_assignment: null,
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
      private workbookService: ManageAddEditScormWorkbookService,
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
      this.selectedClientId = clientDetails?.id ? clientDetails.id : null;
      }

      ngOnInit() {
            this.createWorkbookForm();                         
        
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
            }

            this.getAppBranding();
            this.getModulesList();
            if (
              this.appService.configurable_feature?.sles == true &&
              this.appService.configurable_feature?.arvr == true
            ) {
              this.getGuideList();
            }
      }

      getAppBranding() {
        this.appService.setIconWhiteBranding(this.iconObject);
      }

      @HostListener("window:popstate", ["$event"])
      onPopState(event) {
        this.showWorksheetLeavePopUp();
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

      getGuideList() {
        this.workbookService.getGuideList().subscribe((res: any) => {
          if (res.success && res?.data?.length > 0) {
            this.guideList = res.data;
          } else {
            this.guideList = [];
          }
        });
      }

      // --------------------------------MODULES--------------------------
      getModulesList() {
        this.workbookService.getAllModulesTypes().subscribe((res: any) => {
          if (res.success) {
            this.allModuleList = [];
            this.allModuleList = res.data;
          }
        });
      }

      
      createWorkbookForm() {
        this.workbookForm = this.formBuilder.group({
          id: null,
          title: ["", [Validators.required]],
          descrip: [""],
          status: ["Publish", [Validators.required]],
          DiwoAssets: [null, [Validators.required]],
          ScromAssets: [null],
          allowWithoutPreAssign: [false],
          allowNewLearner: [false],
          newRegProvisional: [false],
          // CourseId: [null],
          // CourseName: [null],
          condition: ["AND"],
          e_duration: [null],
          l_outcomes: [null],      
          isSCORM: [false],
          IsMasteryScore: [false], 
          masteryScore: [null],
        });
      }
    
      get wbform() {
        return this.workbookForm.controls;
      }


    
      getWorkbookById(wookbookId) {
        this.showModuleTypeSelection = false;
        this.workbookService
          .getWorkbookById(this.selectedClientId, wookbookId)
          .subscribe((res: any) => {
            if (res.success) {
              this.workbookForm.patchValue(res.data);
    
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
              
              // Update asset with Scrom Details Extracted content 
              if (res.data.isSCORM === true && res.data.extractedZipFilePath) {
                this.workbookForm.controls["isSCORM"].setValue(true);

                let asset = {
                  path: res.data.path,
                  fileName: res.data.fileName,
                  type: res.data.type,
                  isSCORM: res.data.isSCORM,
                  extractedZipFilePath: res.data.extractedZipFilePath,
                  launchFile: res.data.launchFile
                };
                
                this.workbookForm.controls["ScromAssets"].setValue([asset]);

                console.log(
                  'this.workbookForm.controls["ScromAssets"].value:',
                  this.workbookForm.controls["ScromAssets"].value
                );
              }

            }
              

            if (this.editWorkbook && this.editWorkbook.type == "copy") {
              this.workbookForm.controls["title"].setValue(
                "Copy of - " + res.data.title
              );
              this.workbookForm.controls["id"].setValue(null);
    
              
              // Update asset with Scrom Details Extracted content 
              if (res.data.isSCORM === true && res.data.extractedZipFilePath) {
                this.workbookForm.controls["isSCORM"].setValue(true);

                let asset = {
                  path: res.data.path,
                  fileName: res.data.fileName,
                  type: res.data.type,
                  isSCORM: res.data.isSCORM,
                  extractedZipFilePath: res.data.extractedZipFilePath,
                  launchFile: res.data.launchFile                  
                };
                
                this.workbookForm.controls["ScromAssets"].setValue([asset]);

                console.log(
                  'this.workbookForm.controls["ScromAssets"].value:',
                  this.workbookForm.controls["ScromAssets"].value
                );
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
    
          });
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


      cancelWB() {
        localStorage.setItem("isRedirectAllowed", "true");
        this.router.navigate(["module"]);
      }

      preventNegative(event: any) {
        event.target.value = event.target.value.replace(/[^0-9]/g, "");
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
         
        }
      }

      closeMediaModal() {
        if ((this.typeForSearch !== '.zip') || (this.typeForSearch === '.zip' && this.scromFileUploadProgress === 0)) {
          $('#selectMediaModel').modal('hide');
        }
      }


      async uploadedAssetFromPopUp(asset) {
        switch (this.googleDriveAssetSelectedFor) {

          case "SCORM PACKAGE":
            console.log('asset', asset);
            await this.uploadZipFiles(asset, false);       
            break;

          case "WORKBOOK THUMBNAIL":
            await this.uploadImage(asset, true);
            break;
          
        }
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

                            console.log('before this.workbookForm.value.DiwoAssets in uploadImage', this.workbookForm.value.DiwoAssets);

                            // if (type != 'Image') {                          
                            //   this.workbookForm.controls["DiwoAssets"].setValue([
                            //     {
                            //       path:
                            //         res.data.media_path + res.data.Image[0].filename,
                            //       type: type,
                            //       fileName: res.data.Image[0].originalname,
                            //     },
                            //   ]);
                            // } else if (this.workbookForm.value.DiwoAssets.length <= 0 && type === 'Image') {                          
                            //     this.workbookForm.controls["DiwoAssets"].setValue([
                            //       {
                            //         path: res.data.media_path + res.data.Image[0].filename,
                            //         type: "Image",
                            //         fileName: res.data.Image[0].originalname,
                            //       },
                            //     ]);                            
                            // } else if (this.workbookForm.value.DiwoAssets.length > 0 && type === 'Image') {                              
                            //     const currentAssets = [...this.workbookForm.value.DiwoAssets];
                                                            
                            //     currentAssets.push({
                            //       path: res.data.media_path + res.data.Image[0].filename,
                            //       type: "Image",
                            //       fileName: res.data.Image[0].originalname,
                            //     });
                              
                            //     // Update the form with the updated array
                            //     this.workbookForm.controls["DiwoAssets"].setValue(currentAssets);
                            //   }  

                            const diwoAssets = this.workbookForm.value.DiwoAssets || [];

                            const newAsset = {
                              path: res.data.media_path + res.data.Image[0].filename,
                              type: type,
                              fileName: res.data.Image[0].originalname,
                            };

                            if (type !== 'Image') {
                              // For non-image files (e.g., .zip), replace the DiwoAssets array
                              this.workbookForm.controls["DiwoAssets"].setValue([newAsset]);
                            } else {
                              // For image files, add the new image to the beginning of the array
                              const updatedAssets = [...diwoAssets]; 
                              updatedAssets.unshift(newAsset); // add to start of array
                              this.workbookForm.controls["DiwoAssets"].setValue(updatedAssets);
                            }

                            console.log('after this.workbookForm.value.DiwoAssets in uploadImage', this.workbookForm.value.DiwoAssets);


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
          
          console.log('this.workbookForm.controls["DiwoAssets"]', this.workbookForm.controls["DiwoAssets"]);
          
        }
      }

      async uploadZipFiles(eventOrFile: any, flag: boolean) {  
        if (!this.isviewMode) {
          let file: File;
      
          // Case 1: File from <input type="file">
          if (!flag && eventOrFile?.target?.files?.[0]) {
            file = eventOrFile.target.files[0];
          } 
          // Case 2: File directly passed
          else if (flag && eventOrFile) {
            file = eventOrFile;
          } 
          else {
            this.toastr.warning(
              this.appService.getTranslation("Pages.Workbook.AddEdit.Toaster.uploadzipfiles"),
              this.appService.getTranslation("Utils.warning")
            );
            return;
          }
      
          const fileExtension = file.name.split('.').pop().toLowerCase();
          const maxSizeBytes = 200 * 1024 * 1024; // 200MB

          console.log('file.type', file.type);

          const allowedTypes = ['application/zip', 'application/x-zip-compressed'];
          if (!allowedTypes.includes(file.type)) {
            this.toastr.warning(
              this.appService.getTranslation("Pages.Workbook.AddEdit.Toaster.invalidZipFileType"),
              this.appService.getTranslation("Utils.warning")
            );
            return;
          }
      
          if (fileExtension !== 'zip') {
            this.toastr.warning(
              this.appService.getTranslation("Pages.Workbook.AddEdit.Toaster.invalidZipFileType"),
              this.appService.getTranslation("Utils.warning")
            );
            return;
          }
      
          if (file.size > maxSizeBytes) {
            this.toastr.error(
              this.appService.getTranslation("Pages.Workbook.AddEdit.Toaster.maxZipFileSize"),
              this.appService.getTranslation("Utils.error")
            );
            return;
          }

          const uploadData = new FormData();
          uploadData.append('scormPackage', file); // original zip     
          console.log('uploadData', uploadData);
      
          this.spinnerService.show();
      
          // this.workbookService.uploadDiwoMedia(uploadData, true).subscribe({
          this.workbookService.uploadExtractZipDiwoAsset(uploadData, true).subscribe({            
            next:(event: HttpEvent<any>) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.spinnerService.hide();
                const percentDone = Math.round((event.loaded / event.total) * 100);
                this.scromFileUploadProgress = percentDone;
                console.log('Upload progress:', percentDone, '%');                
              }           

              if(this.scromFileUploadProgress > 0 && this.scromFileUploadProgress < 100){
                this.closeMediaModal();
              }

              // KEEP spinner ON when progress hits 100 but response hasn't come yet
              if (this.scromFileUploadProgress === 100 && event.type !== HttpEventType.Response) {
                this.spinnerService.show();
              }
              
              console.log('event in res', event);
              
              if (event.type === HttpEventType.Response) {
                const res = event.body;                
                this.spinnerService.hide();
                
                // Reset progress bar after upload completes
                this.scromFileUploadProgress = 0;

                if (res.success && res.data.isSCORM) {
                  
                  if (res.data.masteryScore != null) {
                    this.workbookForm.controls["masteryScore"].setValue(res.data.masteryScore);
                    this.workbookForm.controls["IsMasteryScore"].setValue('true');
                  }                  
                  
                  const asset =  {                
                  //   path: res.data.media_path + res.data.scormPackage[0].filename,
                    type: '.zip',
                    fileName: res.data.originalname,
                    isSCORM: res.data.isSCORM,
                    extractedZipFilePath: res.data.extractedFolderPath,
                    launchFile: res.data.launchFile,                    
                  }          
                  console.log('asset', asset);
                  
                  this.workbookForm.controls["isSCORM"].setValue(true);                 
                  this.workbookForm.controls["ScromAssets"].setValue([asset])    

                  console.log('this.workbookForm.value.ScromAssets in uploadZipfiles', this.workbookForm.value.ScromAssets)
                }
                this.cancelMediaPopUp();                               
              }            
            },
            error: (err) => {
              this.spinnerService.hide();
              this.scromFileUploadProgress = 0;                                
              const serverMessage = err?.error?.error || this.appService.getTranslation("Pages.Workbook.AddEdit.Toaster.InvalidScormPackage");              
              this.toastr.error(serverMessage, this.appService.getTranslation("Utils.error"));
              }           
            });

          this.SCORM_package_thumbnail = undefined;
          console.log('DiwoAssets:', this.workbookForm.controls["DiwoAssets"]);
  
        }
      } 

      deleteUploadedZipFile(){
        if(!this.isviewMode) {
          this.workbookForm.controls["ScromAssets"].setValue(null);
          this.workbookForm.controls["isSCORM"].setValue(false);
          this.SCORM_package_thumbnail = undefined;
          this.scromFileUploadProgress = 0
        }
      }

      applyMasteryScoreValidator() {
        const isChecked = this.workbookForm.get('IsMasteryScore')?.value;
        const control = this.workbookForm.get('masteryScore');

        if (isChecked) {
          control?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        } else {
          control?.clearValidators();
        }
        control?.updateValueAndValidity();
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

      save(status, comingFrom?) {

        this.applyMasteryScoreValidator(); 

        if (this.workbookForm.invalid) {
          this.markAsTouched(this.workbookForm);
          return;
        }

        console.log("this.workbookForm", this.workbookForm.value);
    
        let payload = {
          workbook_detail: this.workbookForm.value,           
        };
    
        console.log("payload", payload);
    
        if (status) {
          payload.workbook_detail.status = "Published";
        } else {
          payload.workbook_detail.status = "Draft";
        }
    
        payload.workbook_detail.DiwoModuleId = this.selectedModuleType;
        console.log('this.selectedModuleType', this.selectedModuleType);

        console.log('--payload in save workbook --', payload);
        // return;
    
        this.spinnerService.show();
        if (!this.workbookForm.value.id) {
          this.workbookService
            .createScormWorkbook(payload, this.selectedClientId)
            .subscribe((res: any) => {
              if (res.success) {
                let id = res.data.id;
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
            .updateScormWorkbook(
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

      changeAssetLibareTab(tab) {
        this.showAssetTab = tab;
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

      cancelMediaPopUp() {
        $("#selectMediaModel").modal("hide");
        this.spinnerService.hide();
      }

      clearWorkbookThubnail() {
        if (!this.isviewMode) {

          console.log('this.workbookForm.value.DiwoAssets in clearWorkbookthumbnail before', this.workbookForm.value.DiwoAssets);

          this.workbookForm.controls["DiwoAssets"].setValue(null);

          console.log('this.workbookForm.value.DiwoAssets in clearWorkbookthumbnail after', this.workbookForm.value.DiwoAssets);
        
        }
      }
    

      showWorkbookDetail(flag) {
        if (flag) {        
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

  
}


