import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManagePostsLibraryComponent } from './manage-posts-library.component';
import { ManagePostLibraryRoutes } from './manage-posts-library.routing';
import { ManagePostsLibraryService } from './manage-posts-library.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { AddEditPostComponent } from './add-edit-post/add-edit-post.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { MediaCMSPlayerModule } from '../video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManagePostLibraryRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
		YouTubePlayerModule,
		MediaCMSPlayerModule,
	],
	declarations: [ManagePostsLibraryComponent, AddEditPostComponent],
	providers: [ManagePostsLibraryService, ConfirmationService],
	exports: [CommonModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManagePostsLibraryModule {}
