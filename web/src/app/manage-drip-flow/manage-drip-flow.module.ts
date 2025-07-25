import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageDripFlowsRoutes } from './manage-drip-flow.routing';
import { ManageDripFlowsComponent } from './manage-drip-flow.component';
import { ManageDripFlowsService } from './manage-drip-flow.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
import { ManageLearnerGroupsService } from '../manage-learner-groups/manage-learner-groups.service';
import { AddEditDripFlowComponent } from './add-edit-drip-flow/add-edit-drip-flow.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDripFlowsRoutes),
		FormsModule,
		ReactiveFormsModule,
		NgSelectModule,
		SharedPipesModule,
		ConfirmDialogModule,
		NgxPaginationModule,
		NgxDaterangepickerMd.forRoot(),
		NgMultiSelectDropDownModule.forRoot(),
	],
	declarations: [ManageDripFlowsComponent, AddEditDripFlowComponent],
	providers: [ManageDripFlowsService, ConfirmationService, ManageLearnerGroupsService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ManageDripFlowsModule {}
