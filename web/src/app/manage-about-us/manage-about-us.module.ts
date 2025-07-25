import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageAboutUsComponent } from './manage-about-us.component';
import { ManageAboutUsRoutes } from './manage-about-us.routing';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageAboutUsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageAboutUsComponent]
})
export class ManageAboutUsModule { }
