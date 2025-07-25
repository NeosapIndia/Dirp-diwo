import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditWorkbookComponent } from './add-edit-workbook.component';
import { ManageAddEditWorkbookRoutes } from './add-edit-workbook.routing';
import { ManageAddEditWorkbookService } from './add-edit-workbook.service';
import { SharedPipesModule } from '../../shared';
import { DragulaModule } from 'ng2-dragula';
import { MediaCMSPlayerModule } from 'src/app/video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageAddEditWorkbookRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		DragulaModule.forRoot(),
		MediaCMSPlayerModule,
	],
	declarations: [AddEditWorkbookComponent],
	providers: [ManageAddEditWorkbookService, ConfirmationService],
	schemas: [NO_ERRORS_SCHEMA],
})
export class ManageAddEditWorkbookModule {}
