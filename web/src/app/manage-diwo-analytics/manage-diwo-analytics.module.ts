import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageDiwoAnalyticsRoutes } from './manage-diwo-analytics-routing.routing';
import { ManageDiwoAnalyticsComponent } from './manage-diwo-analytics.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DiwoAnalyticsChartModule } from '../manage-diwo-analytics-chart/diwo-analytics-chart.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDiwoAnalyticsRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxChartsModule,
		NgxDaterangepickerMd.forRoot(),
		DiwoAnalyticsChartModule,
	],
	declarations: [ManageDiwoAnalyticsComponent],
})
export class ManageDiwoAnalyticsModule {}
