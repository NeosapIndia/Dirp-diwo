import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccessDeniedRoutingModule } from './access-denied-routing.module';
import { AccessDeniedComponent } from './access-denied.component';
import { SharedPipesModule } from '../shared';

@NgModule({
  imports: [
    CommonModule,
    AccessDeniedRoutingModule,
    CommonModule,
    SharedPipesModule,
  ],
  declarations: [AccessDeniedComponent]
})
export class AccessDeniedModule { }
