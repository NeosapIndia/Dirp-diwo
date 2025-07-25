import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-integrations',
  templateUrl: './manage-integrations.component.html',
  styleUrls: ['./manage-integrations.component.scss'],
  animations: [routerTransition()]
})
export class ManageIntegrationsComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
