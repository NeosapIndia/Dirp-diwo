import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServerErrorComponent } from './server-error.component';
import { Routes, RouterModule } from '@angular/router';
import { ServerErrorRoutes } from './server-error.routing';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ServerErrorRoutes),

  ],
  declarations: [ServerErrorComponent]
})
export class ServerErrorModule { }
