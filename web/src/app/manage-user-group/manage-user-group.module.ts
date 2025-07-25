import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageUserGroupRoutes } from './manage-user-group.routing';
import { ManageUserGroupComponent } from './manage-user-group.component';
//import { MomentModule } from 'angular2-moment';
import { SharedPipesModule } from '../shared';
import { UserDetailsModule } from '../user-details/user-details.module';
import { NgxPaginationModule } from 'ngx-pagination';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ManageUserGroupRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    //MomentModule,
    SharedPipesModule,
    UserDetailsModule,
    NgxPaginationModule
  ],
  declarations: [ManageUserGroupComponent],
  providers: []

})

export class ManageUserGroupModule { }
