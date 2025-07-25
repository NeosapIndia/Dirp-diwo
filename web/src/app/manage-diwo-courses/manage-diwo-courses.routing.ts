import { Routes } from '@angular/router';
import { ManageDiwoCoursesComponent } from './manage-diwo-courses.component';
import { AddEditDiwoCoursesComponent } from './add-edit-diwo-courses/add-edit-diwo-courses.component';

export const ManagetDiwoCoursesRoutes: Routes = [
	{ path: '', component: ManageDiwoCoursesComponent },
	{ path: 'add-or-edit-diwo-course', component: AddEditDiwoCoursesComponent },
];
