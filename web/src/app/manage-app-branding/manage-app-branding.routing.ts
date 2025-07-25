import { Routes } from '@angular/router';
import { ManageAppBrandingComponent } from './manage-app-branding.component';
import { AddEditAppBrandingComponent } from './add-edit-app-branding/add-edit-app-branding.component';

export const ManageAppBrandingRoutes: Routes = [
  { path: '', component: ManageAppBrandingComponent },
  { path: 'add-edit-general-settings', component: AddEditAppBrandingComponent }
];
