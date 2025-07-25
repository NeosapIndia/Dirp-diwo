import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private router: Router) {}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		if (localStorage.getItem('isLoggedin')) {
			return true;
		}
		setTimeout(() => {
			this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
		}, 100);

		return false;
	}
}
