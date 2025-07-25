import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllWorksheetPage } from './all-worksheets-print.page';

const routes: Routes = [
  {
    path: '',
    component: AllWorksheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllWorksheetPageRoutingModule { }
