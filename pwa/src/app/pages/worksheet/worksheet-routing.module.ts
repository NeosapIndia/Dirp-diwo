import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorksheetPage } from './worksheet.page';

const routes: Routes = [
  {
    path: '',
    component: WorksheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorksheetPageRoutingModule { }
