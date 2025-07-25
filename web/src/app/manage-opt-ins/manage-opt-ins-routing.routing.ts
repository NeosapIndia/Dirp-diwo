import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { ManageOptInsComponent } from './manage-opt-ins.component';
import { AddEditOptInsComponent } from './add-edit-opt-ins/add-edit-opt-ins.component';

export const ManageOptInsRoutes: Routes = [
  { path: '', component: ManageOptInsComponent },
  { path: 'add-or-edit-opt-ins', component: AddEditOptInsComponent },
];



