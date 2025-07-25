import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MarkPresentPage } from './mark-present.page';

const routes: Routes = [
  {
    path: '',
    component: MarkPresentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarkPresentPageRoutingModule { }
