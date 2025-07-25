import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageResetPasswordComponent } from './manage-reset-password.component';
import { Routes, RouterModule } from '@angular/router';
import { ManageResetPasswordRoutes } from './manage-reset-password.routing';
import { SharedPipesModule } from '../shared';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule.forChild(ManageResetPasswordRoutes),
		SharedPipesModule,
	],
	declarations: [ManageResetPasswordComponent],
})
export class ManageResetPasswordModule {}
