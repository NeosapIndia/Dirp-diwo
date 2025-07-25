import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { AddEditTeamSetupsComponent } from './add-edit-teams-setups/add-edit-teams-setups.component';
import { ManageTeamSetupComponent } from './manage-teams-setups.component';
import { ManageTeamSetupRoutes } from './manage-teams-setups.routing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageTeamSetupRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxPaginationModule,
		NgMultiSelectDropDownModule.forRoot(),
	],
	declarations: [ManageTeamSetupComponent, AddEditTeamSetupsComponent],
})
export class ManageTeamSetupsModule {}
