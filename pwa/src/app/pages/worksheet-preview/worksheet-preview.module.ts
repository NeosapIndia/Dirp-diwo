import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WorksheetpreviewPageRoutingModule } from './worksheet-preview-routing.module';
import { WorksheetPreviewPage } from './worksheet-preview.page';
import { DragulaModule } from 'ng2-dragula';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TranslateModule } from '@ngx-translate/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ComponentsModule } from 'src/app/components/components.module';
import { NgxWheelModule } from 'ngx-wheel';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		WorksheetpreviewPageRoutingModule,
		DragulaModule,
		NgxChartsModule,
		TranslateModule.forChild(),
		ComponentsModule,
		DragDropModule,
		ScrollingModule,
		NgxWheelModule,
	],
	declarations: [WorksheetPreviewPage],
})
export class WorksheetpreviewPageModule {}
