import { Routes } from '@angular/router';
import { AddEditUserComponent } from './add-edit-user/add-edit-user.component';

import { ManageUserComponent } from './manage-user.component';
import { UserDetailsComponent } from './user-details/user-details.component';

export const ManageUserRoutes: Routes = [
  { path: '', component: ManageUserComponent },
  { path: 'add-or-edit-user', component: AddEditUserComponent },
  { path: ':id', component: UserDetailsComponent }
];
