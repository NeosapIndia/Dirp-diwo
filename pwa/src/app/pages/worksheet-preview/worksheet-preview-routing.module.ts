import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorksheetPreviewPage } from './worksheet-preview.page';

const routes: Routes = [
  {
    path: '',
    component: WorksheetPreviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorksheetpreviewPageRoutingModule { }
