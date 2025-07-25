import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeeAllTodosPage } from './see-all-todos.page';

const routes: Routes = [
	{
		path: '',
		component: SeeAllTodosPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class SeeAllTodosPageRoutingModule {}
