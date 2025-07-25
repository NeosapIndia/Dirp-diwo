import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandRoverPage } from './land-rover.page';

const routes: Routes = [
	{
		path: '',
		component: LandRoverPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class LandRoverPageRoutingModule {}
