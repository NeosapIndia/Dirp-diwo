import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageSettingsRoutes } from './manage-settings.routing';
import { ManageSettingsComponent } from './manage-settings.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageSettingsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageSettingsComponent]
})
export class ManageSettingsModule { }
