import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageWhatsappTemplateRoutes } from './manage-whatsapp-template.routing';
import { ManageWhatsappTemplateComponent } from './manage-whatsapp-template.component';
import { WhatsAppTemplateService } from './manage-whatsapp-template.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageWhatsappTemplateRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgxPaginationModule,
        NgMultiSelectDropDownModule.forRoot(),
    ],
    declarations: [ManageWhatsappTemplateComponent],
    providers: [WhatsAppTemplateService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ManageWhatsappTemplateModule { }
