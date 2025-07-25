import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PostDetailPageRoutingModule } from './post-detail-routing.module';

import { PostDetailPage } from './post-detail.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    PostDetailPageRoutingModule,
    UtilsModule,
    TranslateModule.forChild()

  ],
  declarations: [PostDetailPage]
})
export class PostDetailPageModule { }
