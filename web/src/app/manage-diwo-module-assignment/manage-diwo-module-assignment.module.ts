import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageDiwoModuleAssignmentRoutes } from './manage-diwo-module-assignment.routing';
import { ManageDiwoModuleAssignmentComponent } from './manage-diwo-module-assignment.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDiwoModuleAssignmentRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
	],
	declarations: [ManageDiwoModuleAssignmentComponent],
})
export class ManageDiwoModuleAssignmentModule {}
