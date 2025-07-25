import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SwitchAccountPage } from './switch-account.page';

const routes: Routes = [
	{
		path: '',
		component: SwitchAccountPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class SwitchAccountPageRoutingModule {}
