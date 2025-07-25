import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageDiwoPathwayAssignmentRoutes } from './manage-diwo-pathway-assignment.routing';
import { ManageDiwoPathwayAssignmentComponent } from './manage-diwo-pathway-assignment.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDiwoPathwayAssignmentRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
	],
	declarations: [ManageDiwoPathwayAssignmentComponent],
})
export class ManageDiwoPathwayAssignmentModule {}
