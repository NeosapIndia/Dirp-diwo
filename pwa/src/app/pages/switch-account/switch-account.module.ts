import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SwitchAccountPageRoutingModule } from './switch-account-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { SwitchAccountPage } from './switch-account.page';

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		IonicModule,
		SwitchAccountPageRoutingModule,
		TranslateModule,
	],
	declarations: [SwitchAccountPage],
})
export class SwitchAccountPageModule {}
