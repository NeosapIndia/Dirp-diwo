import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DripSearchPage } from './drip-search.page';

const routes: Routes = [
  {
    path: '',
    component: DripSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DripSearchPageRoutingModule { }
