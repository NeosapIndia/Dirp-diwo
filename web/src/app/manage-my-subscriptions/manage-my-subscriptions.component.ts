import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-my-subscriptions',
  templateUrl: './manage-my-subscriptions.component.html',
  styleUrls: ['./manage-my-subscriptions.component.scss'],
  animations: [routerTransition()]
})
export class ManageMySubscriptionsComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
