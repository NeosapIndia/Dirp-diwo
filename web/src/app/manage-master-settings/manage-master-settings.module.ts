import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageMasterSettingsComponent } from './manage-master-settings.component';
import { ManageMasterSettingsRoutes } from './manage-master-settings.routing';
import { ManageMasterSettingsService } from './manage-master-settings.service';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageMasterSettingsRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        NgxPaginationModule
    ],
    declarations: [ManageMasterSettingsComponent],
    providers: [ManageMasterSettingsService]
})
export class ManageMasterSettingsModule { }
