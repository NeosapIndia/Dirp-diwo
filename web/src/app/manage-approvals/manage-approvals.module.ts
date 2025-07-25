import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageApprovalsRoutes } from './manage-approvals.routing';
import { ManageApprovalsComponent } from './manage-approvals.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageApprovalsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageApprovalsComponent]
})
export class ManageApprovalsModule { }
