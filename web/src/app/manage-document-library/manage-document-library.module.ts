import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageDocumentLibraryRoutes } from './manage-document-library.routing';
import { ManageDocumentLibraryComponent } from './manage-document-library.component';
import { ManageDocumentLibraryService } from './manage-document-library.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditDocumentComponent } from './add-edit-document/add-edit-document.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MediaCMSPlayerModule } from '../video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDocumentLibraryRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxPaginationModule,
		ConfirmDialogModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		MediaCMSPlayerModule,
	],
	declarations: [ManageDocumentLibraryComponent, AddEditDocumentComponent],
	providers: [ManageDocumentLibraryService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageDocumentLibraryModule {}
