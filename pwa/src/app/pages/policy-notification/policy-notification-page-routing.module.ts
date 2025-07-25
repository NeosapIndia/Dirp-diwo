import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ManagePolicyNotificationPage } from './policy-notification-page.page';


const routes: Routes = [
  {
    path: '',
    component: ManagePolicyNotificationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagePolicyNotificationPageRoutingModule { }
