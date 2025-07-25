import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllCoursesPageRoutingModule } from './all-courses-routing.module';
import { AllCoursesPage } from './all-courses.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		AllCoursesPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [AllCoursesPage],
})
export class AllCoursesPageModule {}
