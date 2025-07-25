import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ManageDiwoHomeRoutes } from './manage-diwo-home-routing.routing';
import { ManageDiwoHomeComponent } from './manage-diwo-home.component';
import { DiwoAnalyticsChartModule } from '../manage-diwo-analytics-chart/diwo-analytics-chart.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageDiwoHomeRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxChartsModule,
		NgxDaterangepickerMd.forRoot(),
		DiwoAnalyticsChartModule,
	],
	declarations: [ManageDiwoHomeComponent],
})
export class ManageDiwoHomeModule {}
