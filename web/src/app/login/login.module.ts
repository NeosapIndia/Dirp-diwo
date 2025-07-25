import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { LoginRoutes } from './login.routing';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(LoginRoutes),
    ReactiveFormsModule,
    SharedPipesModule,
    NgSelectModule,
    FormsModule],
  declarations: [LoginComponent]
})
export class LoginModule { }
