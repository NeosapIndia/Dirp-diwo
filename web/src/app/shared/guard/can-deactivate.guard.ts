import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class CanDeactivateGuard implements CanDeactivate<any> {
	constructor() {}
	canDeactivate(): any {
		let val: any = localStorage.getItem('isRedirectAllowed');
		localStorage.setItem('isRedirectAllowed', 'false');
		if (val == 'false') {
			return false;
		} else {
			return true;
		}
	}
}
