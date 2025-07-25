import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageSystemHealthComponent } from './manage-system-health.component';
import { ManageSystemHealthRoutes } from './manage-system-health.routing';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageSystemHealthRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
	],
	declarations: [ManageSystemHealthComponent],
})
export class ManageSystemHealthModule {}
