import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllWorkbooksPageRoutingModule } from './all-workbooks-routing.module';

import { AllWorkbooksPage } from './all-workbooks.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AllWorkbooksPageRoutingModule,
    IonicModule.forRoot(),
    UtilsModule,
    TranslateModule.forChild()
  ],
  declarations: [AllWorkbooksPage]
})
export class AllWorkbooksPageModule { }
