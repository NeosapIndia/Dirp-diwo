import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDetailsComponent } from './user-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
//import { MomentModule } from 'angular2-moment';
import { SharedPipesModule } from '../shared';
import { UserMoreInfoModule } from '../user-more-info/user-more-info.module';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    // MomentModule,
    SharedPipesModule,
    UserMoreInfoModule,
    ConfirmDialogModule,
    TranslateModule
  ],
  declarations: [UserDetailsComponent],
  exports: [UserDetailsComponent],
  providers: [ConfirmationService]
})
export class UserDetailsModule { }
