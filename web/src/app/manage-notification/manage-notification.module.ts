import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxPaginationModule } from 'ngx-pagination';
import { ManageNotificationComponent } from './manage-notification.component';
import { ManageNotificationRouting } from './manage-notification-routing.routing';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ManageNotificationRouting),
    ReactiveFormsModule,
    SharedPipesModule,
    NgSelectModule,
    FormsModule,
    NgxDaterangepickerMd.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    NgxPaginationModule
  ],
  declarations: [ManageNotificationComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})


export class ManageNotificationModule { }
