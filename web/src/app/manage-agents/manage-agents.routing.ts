import { Routes } from '@angular/router';
import { AddEditAgentsComponent } from './add-edit-agents/add-edit-agents.component';
import { ManageAgentsComponent } from './manage-agents.component';

export const ManageAgentsRoutes: Routes = [
	{ path: '', component: ManageAgentsComponent },
	{ path: 'add-or-edit-agents', component: AddEditAgentsComponent },
];
