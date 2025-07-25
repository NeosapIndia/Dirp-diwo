import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ManagecookieAcceptancePage } from './cookie-acceptance-page.page';


const routes: Routes = [
  {
    path: '',
    component: ManagecookieAcceptancePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagecookieAcceptancePageRoutingModule {}
