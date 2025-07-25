import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { ManagetDiwoPathwaysRoutes } from './manage-diwo-pathways.routing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ManageDiwoPathwayComponent } from './manage-diwo-pathways.component';
import { AddEditDiwoPathwaysComponent } from './add-edit-diwo-pathways/add-edit-diwo-pathways.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DragulaModule } from 'ng2-dragula';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManagetDiwoPathwaysRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxPaginationModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		DragulaModule.forRoot(),
	],
	declarations: [ManageDiwoPathwayComponent, AddEditDiwoPathwaysComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageDiwoPathwaysModule {}
