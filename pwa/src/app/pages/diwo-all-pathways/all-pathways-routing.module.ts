import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllPathwaysPage } from './all-pathways.page';

const routes: Routes = [
	{
		path: '',
		component: AllPathwaysPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AllPathwaysPageRoutingModule {}
