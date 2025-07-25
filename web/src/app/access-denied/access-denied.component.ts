import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-access-denied',
	templateUrl: './access-denied.component.html',
	styleUrls: ['./access-denied.component.scss'],
})
export class AccessDeniedComponent implements OnInit {
	constructor(private router: Router) {}

	ngOnInit() {
		let user =
			JSON.parse(localStorage.getItem('user')) && JSON.parse(localStorage.getItem('user')).user
				? JSON.parse(localStorage.getItem('user'))
				: null;
		if (user) {
			this.router.navigate(['/login']);
		}
	}
}
