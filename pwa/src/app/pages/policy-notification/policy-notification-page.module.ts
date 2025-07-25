import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ManagePolicyNotificationPage } from './policy-notification-page.page';
import { ManagePolicyNotificationPageRoutingModule } from './policy-notification-page-routing.module';
import { TranslateModule } from '@ngx-translate/core';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManagePolicyNotificationPageRoutingModule,
    TranslateModule.forChild()

  ],
  declarations: [ManagePolicyNotificationPage]
})
export class ManagePolicyNotifcationPageModule { }
