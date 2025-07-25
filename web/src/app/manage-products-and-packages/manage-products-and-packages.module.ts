import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageProductsAndPackagesRoutes } from './manage-products-and-packages.routing';
import { ManageProductsAndPackagesComponent } from './manage-products-and-packages.component';
import { AddEditProductAndPackagesComponent } from './add-edit-product-and-packages/add-edit-product-and-packages.component';
import { ViewProductAndPackagesComponent } from './view-product-and-packages/view-product-and-packages.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxPaginationModule } from 'ngx-pagination';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageProductsAndPackagesRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgxDaterangepickerMd.forRoot(),
        NgMultiSelectDropDownModule.forRoot(),
        NgxPaginationModule
    ],
    declarations: [ManageProductsAndPackagesComponent, AddEditProductAndPackagesComponent, ViewProductAndPackagesComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageProductsAndPackagesModule { }
