import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ManageClientsRoutes } from './manage-clients.routing';
import { ManageClientsComponent } from './manage-clients.component';
import { ManageClientsService } from './manage-clients.service';
import { AddEditClientComponent } from './add-edit-client/add-edit-client.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ManageCustomTempModule } from '../manage-custom-template/manage-custom-temp.module';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(ManageClientsRoutes),
		FormsModule,
		ReactiveFormsModule,
		NgSelectModule,
		SharedPipesModule,
		ConfirmDialogModule,
		NgxPaginationModule,
		NgMultiSelectDropDownModule,
		NgxDaterangepickerMd.forRoot(),
		ManageCustomTempModule,
	],
	declarations: [ManageClientsComponent, AddEditClientComponent],
	providers: [ManageClientsService, ConfirmationService],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageClientsModule {}
