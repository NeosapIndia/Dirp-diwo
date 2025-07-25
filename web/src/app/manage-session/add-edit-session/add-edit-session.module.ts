import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SharedPipesModule } from '../../../app/shared';
import { ManageAddEditSessionService } from './add-edit-session.service';
import { ManageAddEditSessionRoutes } from './add-edit-session.routing';
import { ManageAddEditSessionComponent } from './add-edit-session.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { QrCodeModule } from 'ng-qrcode';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageAddEditSessionRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        ConfirmDialogModule,
        NgxPaginationModule,
        QrCodeModule,
        NgxDaterangepickerMd.forRoot(),
    ],
    declarations: [ManageAddEditSessionComponent],
    providers: [
        ManageAddEditSessionService,
        ConfirmationService
    ]
})
export class ManageAddEditSessionModule { }
