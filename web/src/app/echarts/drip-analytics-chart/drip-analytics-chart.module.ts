import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DripAnalyticsChartComponent } from './drip-analytics-chart.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedPipesModule } from 'src/app/shared';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
	imports: [
		CommonModule,

		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		NgxDaterangepickerMd.forRoot(),
	],
	declarations: [DripAnalyticsChartComponent],
	exports: [DripAnalyticsChartComponent],
	schemas: [NO_ERRORS_SCHEMA],
})
export class DripAnalyticsChartModule {}
