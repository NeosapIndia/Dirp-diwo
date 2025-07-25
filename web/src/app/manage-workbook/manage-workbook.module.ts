import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageWorkbookComponent } from './manage-workbook.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditWorkbookComponent } from './add-edit-workbook/add-edit-workbook.component';
import { ManageWorkbookRoutes } from './manage-workbook.routing';
import { ManageWorkbookService } from './manage-workbook.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';
import { MediaCMSPlayerModule } from '../video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageWorkbookRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
		MediaCMSPlayerModule,
	],
	declarations: [ManageWorkbookComponent],
	providers: [ManageWorkbookService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageWorkbookModule {}
