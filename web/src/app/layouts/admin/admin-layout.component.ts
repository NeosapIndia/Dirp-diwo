import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-layout',
  //styles: [':host /deep/ .mat-sidenav-content {padding: 0;} .mat-sidenav-container {z-index: 1000}  @media (min-width: 1200px) .nav-carret { position: absolute;  padding-left: 80px;'],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})

export class AdminLayoutComponent implements OnInit{

  constructor() {}

  ngOnInit() {

  }
}
