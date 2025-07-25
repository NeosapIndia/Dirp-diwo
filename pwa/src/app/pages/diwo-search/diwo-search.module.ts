import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DiwoSearchPageRoutingModule } from './diwo-search-routing.module';
import { DiwoSearchPage } from './diwo-search.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiwoSearchPageRoutingModule,
    ComponentsModule,
    NgCircleProgressModule.forRoot(),
    TranslateModule.forChild()
  ],
  declarations: [DiwoSearchPage]
})
export class DiwoSearchPageModule { }
