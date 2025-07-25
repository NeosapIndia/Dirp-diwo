import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PathwayDetailPageRoutingModule } from './pathway-detail-routing.module';
import { PathwayDetailPage } from './pathway-detail.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		PathwayDetailPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [PathwayDetailPage],
})
export class PathwayDetailPageModule {}
