import { Routes } from '@angular/router';
import { ManageDiwoLicenseComponent } from './manage-diwo-license.component';
import { AddEditDiwoLicenseComponent } from './add-edit-diwo-license/add-edit-diwo-license.component';
import { ViewDiwoLicenseComponent } from './view-diwo-license/view-diwo-license.component';

export const ManageDiwoLicenseRoutes: Routes = [
  { path: '', component: ManageDiwoLicenseComponent },
  { path: 'add-or-edit-diwo-license', component: AddEditDiwoLicenseComponent },
  { path: 'view-diwo-license', component: ViewDiwoLicenseComponent }

];
