import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeeAllWorkbookPage } from './see-all-workbook.page';

const routes: Routes = [
	{
		path: '',
		component: SeeAllWorkbookPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class SeeAllWorkbookPageRoutingModule {}
