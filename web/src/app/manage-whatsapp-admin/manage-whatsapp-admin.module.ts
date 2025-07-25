import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageWhatsappAdminRoutes } from './manage-whatsapp-admin.routing';
import { ManageWhatsappAdminComponent } from './manage-whatsapp-admin.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageWhatsappAdminRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule
    ],
    declarations: [ManageWhatsappAdminComponent]
})
export class ManageWhatsappAdminModule { }
