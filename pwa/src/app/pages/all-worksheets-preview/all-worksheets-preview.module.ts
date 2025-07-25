import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { allworksheetsPreviewRoutingModule } from './all-worksheets-preview-routing.module';

import { allworksheetsPreview } from './all-worksheets-preview.page';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		allworksheetsPreviewRoutingModule,
		NgCircleProgressModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
		ComponentsModule,
	],
	declarations: [allworksheetsPreview],
})
export class allworksheetsPreviewPageModule {}
