import { Routes } from '@angular/router';
import { ManageProductsAndPackagesComponent } from './manage-products-and-packages.component';
import { AddEditProductAndPackagesComponent } from './add-edit-product-and-packages/add-edit-product-and-packages.component';
import { ViewProductAndPackagesComponent } from './view-product-and-packages/view-product-and-packages.component';

export const ManageProductsAndPackagesRoutes: Routes = [
  { path: '', component: ManageProductsAndPackagesComponent },
  { path: 'add-or-edit-license', component: AddEditProductAndPackagesComponent },
  { path: 'view-license', component: ViewProductAndPackagesComponent }

];
