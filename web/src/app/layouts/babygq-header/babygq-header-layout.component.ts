import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs-compat';
import { filter } from 'rxjs/operators';
import { NgxPermissionsService } from 'ngx-permissions';
import { environment } from '../../../environments/environment';
import { AppService } from 'src/app/app.service';
declare var jquery: any;
declare var $: any;

//import { Main } from '../../../assets/js/main.js';
@Component({
	selector: 'app-babygq-header-layout',
	styleUrls: ['./babygq-header-layout.component.scss'],
	templateUrl: './babygq-header-layout.component.html',
})
export class BabygqHeaderComponent implements OnInit, AfterContentInit, OnDestroy {
	private _router: Subscription;
	url: string;
	hideHeader: boolean;
	hideFooter: boolean;
	isHome: boolean;
	isLoggedIn: boolean;
	isVisibleXS: boolean;
	userInfo: any;
	active_role: any;
	userData: any;
	role = localStorage.getItem('role');
	clientName: any;
	adminLogo: any;
	projectType;
	notifcationList = [];
	newNotification: boolean = false;
	isSwitchUser: boolean = false;
	projectName: string;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private permissionsService: NgxPermissionsService,
		public appService: AppService
	) {
		appService.checkNotifcation = true;
	}

	ngOnInit() {
		this._router = this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event: NavigationEnd) => {
				this.url = event.url;
				window.scroll(0, 0);
				$('.modal-backdrop.fade.in').remove();
				$('body').removeClass('modal-open');
			});

		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.projectName = 'drip';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.projectName = 'diwo';
		}

		if (!this.projectName) {
			this.projectName = localStorage.getItem('projectName');
		}

		if (localStorage.getItem('user')) {
			this.userData = JSON.parse(localStorage.getItem('user')).user;
			this.active_role = localStorage.getItem('role');
			if (this.userData.roles.length > 1) {
				this.isSwitchUser = true;
			}
		}
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}

		if (localStorage.getItem('client')) {
			this.clientName = JSON.parse(localStorage.getItem('client')).name || null;
		}

		this.userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
		this.getUserBellNotifcation();
		setTimeout(() => {
			this.getAppBranding();
		}, 200);
	}

	getAppBranding() {
		let userClient = JSON.parse(localStorage.getItem('client'));
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
				let appBranding = res.data;
				if (appBranding && appBranding.admin_side_header_logo_path) {
					this.adminLogo = environment.imageHost + environment.imagePath + appBranding.admin_side_header_logo_path;
				}
				this.projectType = localStorage.getItem('projectName');

				if (!this.projectType) {
					this.projectType = 'drip';
				}
			}
		});
	}

	getUserBellNotifcation() {
		this.appService.getUserBellNotifcation(1, 25).subscribe((res: any) => {
			if (res.success) {
				this.notifcationList = [];
				this.notifcationList = res.data;
				if (this.notifcationList.length > 0) {
					for (let notifcation of this.notifcationList) {
						if (!notifcation.isRead) {
							this.newNotification = true;
						}
					}
				}
			}
		});
	}

	goToNotification() {
		this.newNotification = false;
		this.router.navigate(['/notifications']);
	}

	ngAfterContentInit() {
		$('.sidebar-mobile-toggler').click(function () {
			$('#app').toggleClass('app-slide-off');
		});

		$(window).resize(function () {
			$('.navbar-collapse').addClass('collapse');
		});
	}

	navClose() {
		$('#app').toggleClass('app-sidebar-closed');
	}

	ngOnDestroy() {}

	openNav() {
		(document.getElementById('mySidenav').style.width = '70%'),
			$('#mySidenav .animated').css('visibility', 'hidden'),
			$('#mySidenav .animated').each(function (t) {
				var e = $(this);
				setTimeout(function () {
					$(e).addClass('fadeInDown'), $(e).css('visibility', 'visible');
				}, 50 * (t + 1));
			});
	}

	closeNav() {
		(document.getElementById('mySidenav').style.width = '0'), $('#mySidenav .animated').removeClass('fadeInDown');
	}

	logout() {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		this.appService.logout().subscribe(async (res: any) => {
			if (res) {
				await this.appService.clearUserPersonaldata();
				let project = localStorage.getItem('projectName');
				localStorage.removeItem('userInfo');
				localStorage.removeItem('authToken');
				localStorage.removeItem('registerAs');
				localStorage.removeItem('boatId');
				localStorage.removeItem('menupermission');
				localStorage.clear();
				this.isLoggedIn = false;
				this.permissionsService.flushPermissions();
				localStorage.setItem('projectName', project);
				// this.closeNav();
				setTimeout(() => {
					this.router.navigate(['/login']);
				}, 100);
			}
		});
	}

	register(typeUser) {
		localStorage.setItem('registerAs', typeUser);
		this.router.navigate(['/register']);
	}

	switchUser() {
		let varebale = document.getElementById('reve-chat-container-div');
		if (varebale) {
			varebale.style.display = 'none';
		}
		if (localStorage.getItem('adminuser')) {
			localStorage.removeItem('adminuser');
			localStorage.removeItem('adminmenupermission');
			localStorage.removeItem('adminrole');
		}
		setTimeout(() => {
			this.router.navigate(['/login']);
		}, 100);
	}

	// logout() {
	//   localStorage.removeItem('isLoggedin');
	//   let acceptedTerms = localStorage.getItem('acceptedTerms');
	//   localStorage.clear();
	//   localStorage.setItem('acceptedTerms', acceptedTerms);
	//   this.permissionsService.flushPermissions();
	// }

	checkNotification() {
		this.appService.checkNotifcation = false;

		this.appService.checkUserBellNotification().subscribe((res: any) => {
			if (res.success) {
				if (res.data > 0) {
					this.newNotification = true;
				}
			}
		});
	}
}
