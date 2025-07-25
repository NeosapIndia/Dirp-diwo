import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SingleWorkbookPageRoutingModule } from './single-workbook-routing.module';

import { SingleWorkbookPage } from './single-workbook.page';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SingleWorkbookPageRoutingModule,
    NgCircleProgressModule.forRoot(),
    UtilsModule,
    TranslateModule.forRoot()
  ],
  declarations: [SingleWorkbookPage]
})
export class SingleWorkbookPageModule { }
