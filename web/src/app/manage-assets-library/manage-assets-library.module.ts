import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageAssetsLibraryRoutes } from './manage-assets-library.routing';
import { ManageAssetsLibraryComponent } from './manage-assets-library.component';
import { ManageAssetsLibraryService } from './manage-assets-library.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditAssetsComponent } from './add-edit-assets/add-edit-assets.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MediaCMSPlayerModule } from '../video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageAssetsLibraryRoutes),
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
	declarations: [ManageAssetsLibraryComponent, AddEditAssetsComponent],
	providers: [ManageAssetsLibraryService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageAssetsLibraryModule {}
