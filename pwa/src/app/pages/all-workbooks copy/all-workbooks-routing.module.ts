import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllWorkbooksPage } from './all-workbooks.page';

const routes: Routes = [
  {
    path: '',
    component: AllWorkbooksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllWorkbooksPageRoutingModule { }
