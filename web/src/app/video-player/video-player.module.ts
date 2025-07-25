import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedPipesModule } from '../shared';
import { MediaCMSPlayerComponent } from './video-player.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
	imports: [
		CommonModule,
		SharedPipesModule,
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxDaterangepickerMd.forRoot(),
	],
	declarations: [MediaCMSPlayerComponent],
	exports: [MediaCMSPlayerComponent],
	schemas: [NO_ERRORS_SCHEMA],
})
export class MediaCMSPlayerModule {}
