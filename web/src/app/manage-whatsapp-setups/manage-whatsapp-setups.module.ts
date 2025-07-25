import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

// import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
// import { MomentModule } from 'angular2-moment';
// import { MyDatePickerModule } from 'mydatepicker';
// import { MyDateRangePickerModule } from 'mydaterangepicker';
import { AddEditWhatsAppSetupsComponent } from './add-edit-whatsapp-setups/add-edit-whatsapp-setups.component';
import { ManageWhatsAppSetupComponent } from './manage-whatsapp-setups.component';
import { ManageWhatsAppSetupRoutes } from './manage-whatsapp-setups.routing';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageWhatsAppSetupRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgxPaginationModule,
        NgMultiSelectDropDownModule.forRoot(),
    ],
    declarations: [ManageWhatsAppSetupComponent, AddEditWhatsAppSetupsComponent]
})
export class ManageWhatsAppSetupsModule { }
