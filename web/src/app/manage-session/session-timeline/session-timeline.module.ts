import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SharedPipesModule } from '../../../app/shared';
import { NgxPaginationModule } from 'ngx-pagination';
import { SessionTimelineService } from './session-timeline.service';
import { SessionTimelineComponent } from './session-timeline.component';
import { SessionTimelineRoutes } from './session-timeline.routing';
import { MzdTimelineModule } from 'ngx-mzd-timeline';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { WordCloudModule } from '../../word-cloud/word-cloud.module';
import { MediaCMSPlayerModule } from 'src/app/video-player/video-player.module';
import { NgxEchartsModule } from 'ngx-echarts';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(SessionTimelineRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		NgxPaginationModule,
		WordCloudModule,
		MzdTimelineModule,
		NgxChartsModule,
		MediaCMSPlayerModule,
		NgxEchartsModule.forRoot({
			echarts: () => import('echarts'),
		  }),
	],
	declarations: [SessionTimelineComponent],
	providers: [SessionTimelineService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SessionTimelineModule {}
