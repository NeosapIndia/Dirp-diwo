import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HumanizePipe } from './humanize.pipe';



@NgModule({
  declarations: [HumanizePipe],
  imports: [
    CommonModule
  ],
  exports: [
    HumanizePipe
  ]
})
export class UtilsModule { }
