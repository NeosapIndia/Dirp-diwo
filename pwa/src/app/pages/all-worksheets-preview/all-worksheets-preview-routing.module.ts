import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { allworksheetsPreview } from './all-worksheets-preview.page';

const routes: Routes = [
  {
    path: '',
    component: allworksheetsPreview
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class allworksheetsPreviewRoutingModule { }
