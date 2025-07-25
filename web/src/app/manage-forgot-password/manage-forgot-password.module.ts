import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageForgotPasswordComponent } from './manage-forgot-password.component';
import { Routes, RouterModule } from '@angular/router';
import { ManageForgotPasswordRoutes } from './manage-forgot-password.routing';
import { SharedPipesModule } from '../shared';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule.forChild(ManageForgotPasswordRoutes),
		SharedPipesModule,
	],
	declarations: [ManageForgotPasswordComponent],
})
export class ManageForgotPasswordModule {}
