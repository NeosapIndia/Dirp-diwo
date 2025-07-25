import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';

@Component({
  selector: 'app-manage-approvals',
  templateUrl: './manage-approvals.component.html',
  styleUrls: ['./manage-approvals.component.scss'],
  animations: [routerTransition()]
})
export class ManageApprovalsComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
