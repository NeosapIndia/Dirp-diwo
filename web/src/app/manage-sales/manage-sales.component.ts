import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-sales',
  templateUrl: './manage-sales.component.html',
  styleUrls: ['./manage-sales.component.scss'],
  animations: [routerTransition()]
})
export class ManageSalesComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
