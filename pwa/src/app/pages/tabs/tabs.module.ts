import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsPageRoutingModule } from './tabs-routing.module';
import { TabsPage } from './tabs.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
	imports: [
		IonicModule,
		CommonModule,
		FormsModule,
		TabsPageRoutingModule,
		ComponentsModule,
		TranslateModule.forChild(),
	],
	declarations: [TabsPage],
})
export class TabsPageModule {}
