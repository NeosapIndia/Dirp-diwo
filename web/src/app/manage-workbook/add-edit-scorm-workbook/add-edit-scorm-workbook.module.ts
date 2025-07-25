import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AddEditScromWorkbookComponent } from './add-edit-scorm-workbook.component';
import { ManageAddEditScormWorkbookRoutes } from './add-edit-scorm-workbook.routing';
import { ManageAddEditScormWorkbookService } from './add-edit-scorm-workbook.service';
import { SharedPipesModule } from '../../shared';
import { DragulaModule } from 'ng2-dragula';
import { MediaCMSPlayerModule } from 'src/app/video-player/video-player.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(ManageAddEditScormWorkbookRoutes),
        ReactiveFormsModule,
        SharedPipesModule,
        NgSelectModule,
        FormsModule,
        ConfirmDialogModule,
        DragulaModule.forRoot(),
        MediaCMSPlayerModule,
    ],
    declarations: [AddEditScromWorkbookComponent],
    providers: [ManageAddEditScormWorkbookService, ConfirmationService],
    schemas: [NO_ERRORS_SCHEMA],
})
export class ManageAddEditScormWorkbookModule {}
