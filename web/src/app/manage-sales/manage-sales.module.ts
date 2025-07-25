import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageSalesRoutes } from './manage-sales.routing';
import { ManageSalesComponent } from './manage-sales.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageSalesRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageSalesComponent]
})
export class ManageSalesModule { }
