import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllWorksheetPageRoutingModule } from './all-worksheets-print.routing.module';

import { AllWorksheetPage } from './all-worksheets-print.page';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPrintModule } from 'ngx-print';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		AllWorksheetPageRoutingModule,
		NgCircleProgressModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
		NgxPrintModule,
		NgxChartsModule,
	],
	declarations: [AllWorksheetPage],
})
export class AllWorksheetPageModule {}
