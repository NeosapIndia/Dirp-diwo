import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeeAllWorkbookPageRoutingModule } from './see-all-workbook-routing.module';
import { SeeAllWorkbookPage } from './see-all-workbook.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		SeeAllWorkbookPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [SeeAllWorkbookPage],
})
export class SeeAllWorkbookPageModule {}
