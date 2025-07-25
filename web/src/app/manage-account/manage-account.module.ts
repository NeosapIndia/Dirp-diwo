import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedPipesModule } from '../shared';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ManageAccountRoutes } from './manage-account.routing';
import { ManageAccountComponent } from './manage-account.component';
import { ManageAccountService } from './manage-account.service';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageAccountRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
    ],
    declarations: [ManageAccountComponent],
    providers: [ManageAccountService]
})
export class ManageAccountModule { }
