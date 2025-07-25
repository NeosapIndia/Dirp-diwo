import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PathwayDetailPage } from './pathway-detail.page';

const routes: Routes = [
	{
		path: '',
		component: PathwayDetailPage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class PathwayDetailPageRoutingModule {}
