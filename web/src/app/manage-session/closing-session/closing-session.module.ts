import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SharedPipesModule } from '../../../app/shared';
import { NgxPaginationModule } from 'ngx-pagination';
import { QrCodeModule } from 'ng-qrcode';
import { ManageClosingSessionComponent } from './closing-session.component';
import { ManageClosingSessionService } from './closing-session.service';
import { ManageClosingSessionRoutes } from './closing-session.routing';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageClosingSessionRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        ConfirmDialogModule,
        NgxPaginationModule,
        QrCodeModule,
        NgxDaterangepickerMd.forRoot(),
    ],
    declarations: [ManageClosingSessionComponent],
    providers: [
        ManageClosingSessionService,
        ConfirmationService
    ]
})
export class ManageClosingSessionModule { }
