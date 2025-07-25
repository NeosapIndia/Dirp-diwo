import { Routes } from '@angular/router';
import { AddEditDocumentComponent } from './add-edit-document/add-edit-document.component';
import { ManageDocumentLibraryComponent } from './manage-document-library.component';

export const ManageDocumentLibraryRoutes: Routes = [
	{ path: '', component: ManageDocumentLibraryComponent },
	{ path: 'add-or-edit-document', component: AddEditDocumentComponent },
];
