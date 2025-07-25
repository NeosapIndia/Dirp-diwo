import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageLearnersRoutes } from './manage-learners.routing';
import { ManageLearnersComponent } from './manage-learners.component';
//import { MomentModule } from 'angular2-moment';
import { NgxPaginationModule } from 'ngx-pagination';
import { ManageLearnerService } from './manage-learners.service';
import { ManageClientsService } from '../manage-clients/manage-clients.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageLearnersRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        //MomentModule,
        NgxPaginationModule,
        NgMultiSelectDropDownModule.forRoot(),
        NgxDaterangepickerMd.forRoot(),

    ],
    declarations: [ManageLearnersComponent],
    providers: [ManageLearnerService, ManageClientsService, ConfirmationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageLearnersModule { }
