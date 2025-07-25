import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageHomeComponent } from './manage-home.component';
import { ManageHomeRoutes } from './manage-home.routing';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DripAnalyticsChartModule } from '../echarts/drip-analytics-chart/drip-analytics-chart.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageHomeRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxChartsModule,
		NgxDaterangepickerMd.forRoot(),
		DripAnalyticsChartModule,
	],
	declarations: [ManageHomeComponent],
})
export class ManageHomeModule {}
