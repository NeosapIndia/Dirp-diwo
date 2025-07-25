import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageDiwoCourseAssignmentRoutes } from './manage-diwo-course-assignment.routing';
import { ManageDiwoCourseAssignmentComponent } from './manage-diwo-course-assignment.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDiwoCourseAssignmentRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
	],
	declarations: [ManageDiwoCourseAssignmentComponent],
})
export class ManageDiwoCourseAssignmentModule {}
