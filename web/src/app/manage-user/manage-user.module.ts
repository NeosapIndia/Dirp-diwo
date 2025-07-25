import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { ManageUserRoutes } from './manage-user.routing';

import { ManageUserComponent } from './manage-user.component';
import { UserDetailsComponent } from './user-details/user-details.component';
//import { MomentModule } from 'angular2-moment';
import { SharedPipesModule } from '../shared';
import { UserDetailsModule } from '../user-details/user-details.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { ManageUserService } from './manage-user.service';
import { ManageClientsService } from '../manage-clients/manage-clients.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditUserComponent } from './add-edit-user/add-edit-user.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ManageUserRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    //MomentModule,
    SharedPipesModule,
    UserDetailsModule,
    NgxPaginationModule,
    NgMultiSelectDropDownModule.forRoot(),
    NgxDaterangepickerMd.forRoot(),
  ],
  declarations: [ManageUserComponent, UserDetailsComponent, AddEditUserComponent],
  providers: [ManageUserService, ManageClientsService, ConfirmationService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})

export class ManageUserModule { }
