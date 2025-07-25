import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageMySubscriptionsRoutes } from './manage-my-subscriptions.routing';
import { ManageMySubscriptionsComponent } from './manage-my-subscriptions.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageMySubscriptionsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageMySubscriptionsComponent]
})
export class ManageMySubscriptionsModule { }
