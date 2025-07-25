import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WorksheetPageRoutingModule } from './worksheet-routing.module';
import { WorksheetPage } from './worksheet.page';
import { DragulaModule } from 'ng2-dragula';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TranslateModule } from '@ngx-translate/core';
import { UtilsModule } from 'src/app/utils/utils.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ComponentsModule } from 'src/app/components/components.module';
import { NgxWheelModule } from 'ngx-wheel';
// import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
// import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
// import { SafeUrlPipe } from '../../../app/safe-url.pipe';
import { NgxEchartsModule } from 'ngx-echarts';
import  { ScormPlayerComponent } from '../../components/scorm-player/scorm-player.component';
import { QuillModule } from 'ngx-quill';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		WorksheetPageRoutingModule,
		DragulaModule,
		NgxChartsModule,
		TranslateModule.forChild(),
		UtilsModule,
		NgCircleProgressModule.forRoot(),
		DragDropModule,
		ScrollingModule,
		ComponentsModule,
		NgxWheelModule,		
		PdfViewerModule,
		QuillModule,		
		NgxEchartsModule.forRoot({
			echarts: () => import('echarts'),
		  }),
		// PdfViewerModule,
		// PdfJsViewerModule 
		
	],
	declarations: [WorksheetPage],
})
export class WorksheetPageModule {}
