import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { AddEditAgentsComponent } from './add-edit-agents/add-edit-agents.component';
import { ManageAgentsComponent } from './manage-agents.component';
import { ManageAgentsRoutes } from './manage-agents.routing';
import { ManageAgentsService } from './manage-agents.service';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageAgentsRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxPaginationModule,
		ConfirmDialogModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
	],
	declarations: [AddEditAgentsComponent, ManageAgentsComponent],
	providers: [ManageAgentsService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageAssetsLibraryModule {}
