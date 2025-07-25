import { Routes } from '@angular/router';
import { AddEditPostComponent } from './add-edit-post/add-edit-post.component';
import { ManagePostsLibraryComponent } from './manage-posts-library.component';

export const ManagePostLibraryRoutes: Routes = [
  { path: '', component: ManagePostsLibraryComponent },
  { path: 'add-or-edit-drip', component: AddEditPostComponent }
];
