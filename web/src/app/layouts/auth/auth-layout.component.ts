import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs-compat';

declare var jquery: any;
declare var $: any;
@Component({
	selector: 'app-layout',
	templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent implements OnInit, AfterContentInit, OnDestroy {
	private _router: Subscription;

	constructor(private router: Router, private route: ActivatedRoute) {}
	ngOnInit() {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
	}
	ngAfterContentInit() {}
	ngOnDestroy() {
		//this._router.unsubscribe();
	}

	isMobile() {
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			return true;
		} else {
			return false;
		}
	}
}
