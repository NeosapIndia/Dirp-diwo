import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LandRoverPage } from './land-rover.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { DragulaModule } from 'ng2-dragula';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ComponentsModule } from 'src/app/components/components.module';
import { LandRoverPageRoutingModule } from './land-rover-routing.module';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		LandRoverPageRoutingModule,
		UtilsModule,
		DragulaModule,
		TranslateModule.forChild(),
		NgxChartsModule,
		DragDropModule,
		ScrollingModule,
		ComponentsModule,
	],
	declarations: [LandRoverPage],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandRoverPageModule {}
