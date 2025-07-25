import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxPaginationModule } from 'ngx-pagination';
import { ManageDiwoLicenseRoutes } from './manage-diwo-license.routing';
import { AddEditDiwoLicenseComponent } from './add-edit-diwo-license/add-edit-diwo-license.component';
import { ManageDiwoLicenseComponent } from './manage-diwo-license.component';
import { ViewDiwoLicenseComponent } from './view-diwo-license/view-diwo-license.component';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageDiwoLicenseRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgxDaterangepickerMd.forRoot(),
        NgMultiSelectDropDownModule.forRoot(),
        NgxPaginationModule
    ],
    declarations: [AddEditDiwoLicenseComponent, ViewDiwoLicenseComponent, ManageDiwoLicenseComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageDiwoLicenseModule { }
