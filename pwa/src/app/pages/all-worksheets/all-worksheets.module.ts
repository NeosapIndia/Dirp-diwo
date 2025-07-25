import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SingleWorkbookPageRoutingModule } from './all-worksheets-routing.module';

import { SingleWorkbookPage } from './all-worksheets.page';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'src/app/components/components.module';
import  { ScormPlayerComponent } from '../../components/scorm-player/scorm-player.component';
import { QuillModule } from 'ngx-quill';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		SingleWorkbookPageRoutingModule,
		NgCircleProgressModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
		ComponentsModule,
		QuillModule,		
	],
	// declarations: [SingleWorkbookPage],
	declarations: [SingleWorkbookPage, ScormPlayerComponent],
})
export class SingleWorkbookPageModule {}
