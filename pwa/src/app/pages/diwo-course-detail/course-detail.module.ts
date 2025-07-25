import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CourseDetailPageRoutingModule } from './course-detail-routing.module';
import { CourseDetailPage } from './course-detail.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		CourseDetailPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [CourseDetailPage],
})
export class CourseDetailPageModule {}
