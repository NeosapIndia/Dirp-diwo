import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageOptInsRoutes } from './manage-opt-ins-routing.routing';
import { ManageOptInsComponent } from './manage-opt-ins.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';
import { AddEditOptInsComponent } from './add-edit-opt-ins/add-edit-opt-ins.component';


@NgModule({
  declarations: [ManageOptInsComponent, AddEditOptInsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(ManageOptInsRoutes),
    ReactiveFormsModule,
    SharedPipesModule,
    NgSelectModule,
    FormsModule,
    NgxDaterangepickerMd.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    NgxPaginationModule
  ]
})
export class ManageOptInsModule { }
