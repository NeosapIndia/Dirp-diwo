import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageIntegrationsRoutes } from './manage-integrations.routing';
import { ManageIntegrationsComponent } from './manage-integrations.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageIntegrationsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageIntegrationsComponent]
})
export class ManageIntegrationsModule { }
