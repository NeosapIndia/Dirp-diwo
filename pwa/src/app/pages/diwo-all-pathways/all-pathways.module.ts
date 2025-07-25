import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllPathwaysPageRoutingModule } from './all-pathways-routing.module';
import { AllPathwaysPage } from './all-pathways.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		AllPathwaysPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [AllPathwaysPage],
})
export class AllPathwaysPageModule {}
