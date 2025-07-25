import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotFoundComponent } from './not-found.component';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundRoutes } from './not-found.routing';
import { SharedPipesModule } from '../shared';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(NotFoundRoutes),
    SharedPipesModule,
  ],
  declarations: [NotFoundComponent]
})
export class NotFoundModule { }
