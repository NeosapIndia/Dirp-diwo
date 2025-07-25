import { Routes } from '@angular/router';
import { ManageSupportComponent } from './manage-support.component';
import { AddEditSupportComponent } from './add-edit-support/add-edit-support.component';

export const ManageSupportRoutes: Routes = [
  { path: '', component: ManageSupportComponent },
  { path: 'add-edit-support', component: AddEditSupportComponent }
];
