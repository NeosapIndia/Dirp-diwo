import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeeAllTodosPageRoutingModule } from './see-all-todos-routing.module';
import { SeeAllTodosPage } from './see-all-todos.page';
import { UtilsModule } from 'src/app/utils/utils.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		SeeAllTodosPageRoutingModule,
		IonicModule.forRoot(),
		UtilsModule,
		TranslateModule.forChild(),
	],
	declarations: [SeeAllTodosPage],
})
export class SeeAllTodosPageModule {}
