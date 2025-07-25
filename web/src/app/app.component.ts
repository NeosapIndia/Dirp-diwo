import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { AppService } from './app.service';
import { environment } from 'src/environments/environment';
import '@mux/mux-player';

declare var jquery: any;
declare var $: any;

@Component({
	selector: 'app-root',
	// template: '<ngx-spinner bdColor = "rgba(51, 51, 51, 0.8)" size = "medium" color = "#6513e1"type = "ball-clip-rotate"></ngx-spinner><router-outlet> </router-outlet> '
	// template: `<ngx-spinner bdColor = "rgba(0, 0, 0, 0.8)" size = "large" color = "#ff0066" type = "ball-pulse" ></ngx-spinner><router-outlet> </router-outlet> `
	templateUrl: 'app.component.html',
})
export class AppComponent implements AfterViewInit {
	@ViewChild('root') root;
	private token: any;
	projectName;

	constructor(
		private permissionsService: NgxPermissionsService,
		public appService: AppService,
		private router: Router,
		private route: ActivatedRoute
	) {
		this.appService.switchLanguage('en');
		this.route.queryParamMap.subscribe((params: any) => {
			this.token = params.params.token;
		});

		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				// (<any>window).ga('set', 'page', event.urlAfterRedirects);
				// (<any>window).ga('send', 'pageview');
			}
		});

		let link = window.location.href;
		let urlParams = new URLSearchParams(link.split('?')[1]);
		let projectName = urlParams.get('project');
		if (projectName) {
			projectName = projectName.toLowerCase();
		}

		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.projectName = 'drip';
			localStorage.setItem('projectName', this.projectName);
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.projectName = 'diwo';
			localStorage.setItem('projectName', this.projectName);
		}

		//For Dev Server
		if (!this.projectName) {
			let link = window.location.href;
			let urlParams = new URLSearchParams(link.split('?')[1]);
			this.projectName = urlParams.get('project');
			if (this.projectName) {
				this.projectName = this.projectName.toLowerCase();
			}
			if (this.projectName == 'drip') {
				localStorage.setItem('projectName', this.projectName);
			} else if (this.projectName == 'diwo') {
				localStorage.setItem('projectName', this.projectName);
			}
			if (!this.projectName) {
				this.projectName = localStorage.getItem('projectName');
				if (this.projectName != 'drip' && this.projectName != 'diwo') {
					this.projectName = 'drip';
					localStorage.setItem('projectName', this.projectName);
				}
			}
		}
		if (!localStorage.getItem('loginAppBrading')) {
			this.appService.getLoginAppBrading().subscribe((res: any) => {
				if (res.success) {
					localStorage.setItem('loginAppBrading', JSON.stringify(res.data));
				}
			});
		}
	}

	ngOnInit() {
		const currentUrl = window.location.href;
		const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
		const isResetPassword = urlParams.get('isResetPassword');
		const token = urlParams.get('token');
		const pageMode = urlParams.get('pageMode');
		const type = urlParams.get('type');

		if (currentUrl && isResetPassword && token) {
			localStorage.clear();

			localStorage.setItem('projectName', type);
			localStorage.setItem('token', token);
			localStorage.setItem('comingFrom', '/');

			setTimeout(() => {
				this.router.navigate(['/reset-password', { pageMode: pageMode }]);
			}, 200);
		} else if (!document.location.href.includes('session-details') && !document.location.href.includes('word-cloud')) {
			this.router.navigate(['/login']);
		}

		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		setTimeout(() => {
			if (!this.token) {
				if (localStorage.getItem('user') && localStorage.getItem('isLoggedin')) {
					var data = JSON.parse(localStorage.getItem('user') || null);

					let admin_roles = [
						'Product Owner Super Admin',
						'Product Owner Admin',
						'Partner Super Admin',
						'Partner Admin',
						'Client Admin',
						'Branch Admin',
						'Analyst',
						'Content Author',
						'Business Manager',
						'Facilitator',
					];
					let admin_roles_uppercase = [
						'PRODUCT OWNER SUPER ADMIN',
						'PRODUCT OWNER ADMIN',
						'PARTNER SUPER ADMIN',
						'PARTNER ADMIN',
						'CLIENT ADMIN',
						'BRANCH ADMIN',
						'ANALYST',
						'CONTENT AUTHOR',
						'BUSINESS MANAGER',
						'FACILITATOR',
					];

					// let admin_roles = ['Support Manager', 'Admin', 'Super Admin', 'Finance', 'Operations', 'Support Admin', 'Support Partner', 'Supply Chain Manager', 'Expert', 'Supply Chain Partner', 'Content Admin', 'Content Tester', 'Counsellor', 'Global Super Admin', 'Global Admin', 'Global Operations', 'Global Finance', 'Global Customer Support', 'Global Supply Chain', 'Advisor'];
					// let admin_roles_uppercase = ['SUPPORT MANAGER', 'ADMIN', 'SUPER ADMIN', 'FINANCE', 'OPERATIONS', 'SUPPORT ADMIN', 'SUPPORT PARTNER', 'SUPPLY CHAIN MANAGER', 'EXPERT', 'SUPPLY CHAIN PARTNER', 'CONTENT ADMIN', 'CONTENT TESTER', 'COUNSELLOR', 'GLOBAL SUPER ADMIN', 'GLOBAL ADMIN', 'GLOBAL OPERATIONS', 'GLOBAL FINANCE', 'GLOBAL CUSTOMER SUPPORT', 'GLOBAL SUPPLY CHAIN', 'ADVISOR'];
					let user_role = localStorage.getItem('role');
					if (data.user && admin_roles.indexOf(user_role) > -1) {
						let index = admin_roles.indexOf(user_role);
						const perm = [admin_roles_uppercase[index]];
						this.permissionsService.loadPermissions(perm);
					}
				}
			}
		}, 500);
	}

	ngAfterViewInit() {}
}
