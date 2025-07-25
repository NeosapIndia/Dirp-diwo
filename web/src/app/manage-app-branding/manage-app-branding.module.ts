import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageAppBrandingRoutes } from './manage-app-branding.routing';
import { ManageAppBrandingComponent } from './manage-app-branding.component';

import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ManageAppBrandingService } from './manage-app-branding.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AddEditAppBrandingComponent } from './add-edit-app-branding/add-edit-app-branding.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageAppBrandingRoutes),
		FormsModule,
		ReactiveFormsModule,
		NgSelectModule,
		SharedPipesModule,
		ConfirmDialogModule,
		NgxPaginationModule,
		NgMultiSelectDropDownModule.forRoot(),
	],
	declarations: [ManageAppBrandingComponent, AddEditAppBrandingComponent],
	providers: [ManageAppBrandingService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageAppBrandingModule {}
