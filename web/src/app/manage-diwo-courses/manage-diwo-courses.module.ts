import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { ManagetDiwoCoursesRoutes } from './manage-diwo-courses.routing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ManageDiwoCoursesComponent } from './manage-diwo-courses.component';
import { AddEditDiwoCoursesComponent } from './add-edit-diwo-courses/add-edit-diwo-courses.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DragulaModule } from 'ng2-dragula';
import { ManagetDiwoCoursesService } from './manage-diwo-courses.service';
import { ConfirmationService } from 'primeng/api';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManagetDiwoCoursesRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxPaginationModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		DragulaModule.forRoot(),
	],
	declarations: [ManageDiwoCoursesComponent, AddEditDiwoCoursesComponent],
	providers: [ManagetDiwoCoursesService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageDiwoCoursesModule {}
