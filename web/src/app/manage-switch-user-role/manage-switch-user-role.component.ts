import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-switch-user-role',
  templateUrl: './manage-switch-user-role.component.html',
  styleUrls: ['./manage-switch-user-role.component.scss'],
  animations: [routerTransition()]
})
export class ManageSwitchUserRoleComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
