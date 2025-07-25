import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomTemplatePage } from './custom-template.page';

const routes: Routes = [
	{
		path: '',
		component: CustomTemplatePage,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class CustomTemplatePageRoutingModule {}
