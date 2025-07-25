import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';


@Component({
  selector: 'app-manage-whatsapp-admin',
  templateUrl: './manage-whatsapp-admin.component.html',
  styleUrls: ['./manage-whatsapp-admin.component.scss'],
  animations: [routerTransition()]
})
export class ManageWhatsappAdminComponent implements OnInit {

    constructor(){}

    ngOnInit() {

    }
}
