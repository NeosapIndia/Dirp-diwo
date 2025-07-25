import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MarkPresentPageRoutingModule } from './mark-present-routing.module';

import { MarkPresentPage } from './mark-present.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    MarkPresentPageRoutingModule,
    TranslateModule.forChild()
  ],
  declarations: [MarkPresentPage]
})
export class MarkPresentPageModule { }
