import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ManageWhatsAppOptInAcceptPage } from './whatsApp-opt-in-accept-page.page';


const routes: Routes = [
  {
    path: '',
    component: ManageWhatsAppOptInAcceptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageWhatsAppOptInPageRoutingModule { }
