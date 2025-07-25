import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';



import { TranslateModule } from '@ngx-translate/core';
import { LogOutPage } from './logout-page.page';
import { LogOutPageRoutingModule } from './logout-page-routing.module';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    LogOutPageRoutingModule,
    TranslateModule
  ],
  declarations: [LogOutPage]
})
export class LogOutPageModule { }
