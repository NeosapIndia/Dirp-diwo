import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllPostPageRoutingModule } from './all-post-routing.module';

import { AllPostPage } from './all-post.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		AllPostPageRoutingModule,
		ComponentsModule,
		NgCircleProgressModule.forRoot(),
		TranslateModule.forChild(),
	],
	declarations: [AllPostPage],
})
export class AllPostPageModule {}
