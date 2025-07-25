import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgxPaginationModule } from 'ngx-pagination';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { LandRoverComponent } from './land-rover.component';
import { LandRoverRoutes } from './land-rover.routing';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(LandRoverRoutes),
		ReactiveFormsModule,
		SharedPipesModule,
		NgSelectModule,
		FormsModule,
		ConfirmDialogModule,
		NgMultiSelectDropDownModule.forRoot(),
		NgxDaterangepickerMd.forRoot(),
		NgxPaginationModule,
		YouTubePlayerModule,
	],
	declarations: [LandRoverComponent],
	providers: [ConfirmationService],
	exports: [CommonModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandRoverModule {}
