import { Routes } from '@angular/router';
import { ManageDiwoPathwayComponent } from './manage-diwo-pathways.component';
import { AddEditDiwoPathwaysComponent } from './add-edit-diwo-pathways/add-edit-diwo-pathways.component';

export const ManagetDiwoPathwaysRoutes: Routes = [
	{ path: '', component: ManageDiwoPathwayComponent },
	{ path: 'add-or-edit-diwo-pathway', component: AddEditDiwoPathwaysComponent },
];
