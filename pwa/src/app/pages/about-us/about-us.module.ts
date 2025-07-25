import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AboutUsPageRoutingModule } from './about-us-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { AboutUsPage } from './about-us.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    AboutUsPageRoutingModule,
    TranslateModule
  ],
  declarations: [AboutUsPage]
})
export class AboutUsPageModule { }
