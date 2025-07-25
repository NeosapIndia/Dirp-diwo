import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMoreInfoComponent } from './user-more-info.component';
import { SharedPipesModule } from '../shared'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  imports: [
    CommonModule,
    SharedPipesModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
  ],
  declarations: [UserMoreInfoComponent],
  exports: [UserMoreInfoComponent]
})
export class UserMoreInfoModule { }
