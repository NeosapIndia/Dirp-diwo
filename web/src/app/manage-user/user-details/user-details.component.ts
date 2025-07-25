import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-details-info',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
  providers: []
})
export class UserDetailsComponent implements OnInit {
  public userId: any;
  public sub: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.userId = +params['id'];
    });
  }
}
