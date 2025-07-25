import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SingleWorkbookPage } from './single-workbook.page';

const routes: Routes = [
  {
    path: '',
    component: SingleWorkbookPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SingleWorkbookPageRoutingModule { }
