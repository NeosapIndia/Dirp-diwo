import { Routes } from '@angular/router';
import { AddEditLearnerGroupsComponent } from './add-edit-learner-groups/add-edit-learner-groups.component';
import { ManageLearnerGroupsComponent } from './manage-learner-groups.component';

export const ManageLearnerGroupsroutes: Routes = [
	{ path: '', component: ManageLearnerGroupsComponent },
	{ path: 'add-or-edit-learner-group', component: AddEditLearnerGroupsComponent },
	{ path: 'add-or-edit-contact-group', component: AddEditLearnerGroupsComponent },
];
