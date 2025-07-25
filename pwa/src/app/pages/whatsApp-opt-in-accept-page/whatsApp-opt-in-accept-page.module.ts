import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ManageWhatsAppOptInAcceptPage } from './whatsApp-opt-in-accept-page.page';
import { ManageWhatsAppOptInPageRoutingModule } from './whatsApp-opt-in-accept-page-routing.module';
import { TranslateModule } from '@ngx-translate/core';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageWhatsAppOptInPageRoutingModule,
    TranslateModule.forChild()

  ],
  declarations: [ManageWhatsAppOptInAcceptPage]
})
export class ManageWhatsAppOptInAcceptPageModule { }
