import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-settings',
  templateUrl: './manage-settings.component.html',
  styleUrls: ['./manage-settings.component.scss'],
  animations: [routerTransition()]
})
export class ManageSettingsComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
