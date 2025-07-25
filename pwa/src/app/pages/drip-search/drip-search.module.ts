import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DripSearchPageRoutingModule } from './drip-search-routing.module';
import { DripSearchPage } from './drip-search.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DripSearchPageRoutingModule,
    ComponentsModule,
    NgCircleProgressModule.forRoot(),
    TranslateModule.forChild()
  ],
  declarations: [DripSearchPage]
})
export class DripSearchPageModule { }
