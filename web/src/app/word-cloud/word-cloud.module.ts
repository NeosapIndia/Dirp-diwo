import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { NgxPaginationModule } from 'ngx-pagination';
import { WordCloudService } from './word-cloud.service';
import { WordCloudComponent } from './word-cloud.component';
// import { WordCloudRoutes } from './word-cloud.routing';
import { MzdTimelineModule } from 'ngx-mzd-timeline';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TagCloudComponent } from 'angular-tag-cloud-module';
import { SharedPipesModule } from '../shared';

@NgModule({
	imports: [
		CommonModule,
		// RouterModule.forChild(WordCloudRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		NgxPaginationModule,
		MzdTimelineModule,
		NgxChartsModule,
		TagCloudComponent,
	],
	declarations: [WordCloudComponent],
	exports: [WordCloudComponent],
	providers: [WordCloudService, ConfirmationService],
	schemas: [NO_ERRORS_SCHEMA],
})
export class WordCloudModule {}
