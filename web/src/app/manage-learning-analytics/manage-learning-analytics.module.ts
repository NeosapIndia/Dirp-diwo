import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageLearningAnalyticsComponent } from './manage-learning-analytics.component';
import { ManageLearningAnalyticsRoutes } from './manage-learning-analytics.routing';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';
import { DripAnalyticsChartModule } from '../echarts/drip-analytics-chart/drip-analytics-chart.module';
import { MediaCMSPlayerModule } from '../video-player/video-player.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageLearningAnalyticsRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxChartsModule,
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
		DripAnalyticsChartModule,
		MediaCMSPlayerModule,
	],
	declarations: [ManageLearningAnalyticsComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageLearningAnalyticsModule {}
