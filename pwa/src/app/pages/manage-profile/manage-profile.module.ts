import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageProfilePageRoutingModule } from './manage-profile-routing.module';

import { ManageProfilePage } from './manage-profile.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageProfilePageRoutingModule,
    TranslateModule.forChild()

  ],
  declarations: [ManageProfilePage]
})
export class ManageProfilePageModule { }
