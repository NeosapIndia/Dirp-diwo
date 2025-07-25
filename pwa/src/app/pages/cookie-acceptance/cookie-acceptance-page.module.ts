import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ManagecookieAcceptancePage } from './cookie-acceptance-page.page';
import { ManagecookieAcceptancePageRoutingModule } from './cookie-acceptance-page-routing.module';
import { TranslateModule } from '@ngx-translate/core';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManagecookieAcceptancePageRoutingModule,
    TranslateModule.forChild()

  ],
  declarations: [ManagecookieAcceptancePage]
})
export class ManagecookieAcceptancePageModule { }
