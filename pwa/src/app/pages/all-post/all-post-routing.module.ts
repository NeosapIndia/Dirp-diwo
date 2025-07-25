import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllPostPage } from './all-post.page';

const routes: Routes = [
  {
    path: '',
    component: AllPostPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllPostPageRoutingModule { }
