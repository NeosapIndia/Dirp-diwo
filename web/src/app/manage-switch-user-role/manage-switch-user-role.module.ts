import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageSwitchUserRoleRoutes } from './manage-switch-user-role.routing';
import { ManageSwitchUserRoleComponent } from './manage-switch-user-role.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageSwitchUserRoleRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageSwitchUserRoleComponent]
})
export class ManageSwitchUserRoleModule { }
