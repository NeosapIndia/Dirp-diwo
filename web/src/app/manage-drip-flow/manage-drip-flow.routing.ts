import { Routes } from '@angular/router';
import { ManageDripFlowsComponent } from './manage-drip-flow.component';
import { AddEditDripFlowComponent } from './add-edit-drip-flow/add-edit-drip-flow.component';

export const ManageDripFlowsRoutes: Routes = [
  { path: '', component: ManageDripFlowsComponent },
  { path: 'add-or-edit-drip-flow', component: AddEditDripFlowComponent }
];
