import { Routes } from '@angular/router';
import { AddEditClientComponent } from './add-edit-client/add-edit-client.component';
import { ManageClientsComponent } from './manage-clients.component';

export const ManageClientsRoutes: Routes = [
  { path: '', component: ManageClientsComponent },
  { path: 'add-or-edit-client', component: AddEditClientComponent }
];
