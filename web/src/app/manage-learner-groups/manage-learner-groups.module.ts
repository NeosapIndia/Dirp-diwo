import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
import { ManageLearnerGroupsroutes } from './manage-learner-groups.routing';
import { ManageLearnerGroupsComponent } from './manage-learner-groups.component';
import { ManageLearnerGroupsService } from './manage-learner-groups.service';
import { AddEditLearnerGroupsComponent } from './add-edit-learner-groups/add-edit-learner-groups.component';
//import { MomentModule } from 'angular2-moment';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageLearnerGroupsroutes),
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        SharedPipesModule,
        //MomentModule,
        ConfirmDialogModule,
        NgxPaginationModule,
        NgMultiSelectDropDownModule.forRoot(),
        NgxDaterangepickerMd.forRoot(),
    ],
    declarations: [ManageLearnerGroupsComponent, AddEditLearnerGroupsComponent],
    providers: [ManageLearnerGroupsService, ConfirmationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageLearnerGroupsModule { }
