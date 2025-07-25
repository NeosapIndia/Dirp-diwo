import { Routes } from '@angular/router';
import { AddEditAssetsComponent } from './add-edit-assets/add-edit-assets.component';
import { ManageAssetsLibraryComponent } from './manage-assets-library.component';

export const ManageAssetsLibraryRoutes: Routes = [
  { path: '', component: ManageAssetsLibraryComponent },
  { path: 'add-or-edit-assets', component: AddEditAssetsComponent }
];
