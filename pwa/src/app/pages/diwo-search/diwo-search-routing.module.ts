import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DiwoSearchPage } from './diwo-search.page';

const routes: Routes = [
  {
    path: '',
    component: DiwoSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiwoSearchPageRoutingModule { }
