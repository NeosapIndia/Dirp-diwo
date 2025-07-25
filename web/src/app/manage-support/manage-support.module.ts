import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageSupportComponent } from './manage-support.component';
import { ManageSupportRoutes } from './manage-support.routing';
import { AddEditSupportComponent } from './add-edit-support/add-edit-support.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxPaginationModule } from 'ngx-pagination';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageSupportRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgMultiSelectDropDownModule.forRoot(),
        NgxPaginationModule
    ],
    declarations: [ManageSupportComponent, AddEditSupportComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageSupportModule { }
