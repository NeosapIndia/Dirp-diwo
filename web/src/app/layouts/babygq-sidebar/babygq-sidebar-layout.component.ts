import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { NgxPermissionsService } from 'ngx-permissions';
import { AppService } from '../../../app/app.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs-compat';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'babygq-sidebar-layout',
	// styles: [':host /deep/ .mat-sidenav-content {padding: 0;} .mat-sidenav-container {z-index: 1000} '],
	templateUrl: './babygq-sidebar-layout.component.html',
})
export class BabygqSidebarComponent implements OnInit, AfterContentInit, OnDestroy {
	private _router: Subscription;
	private active_role: any;
	userData: any;
	role = localStorage.getItem('role');
	permissionObject: {
		H: any[];
		POA: any[];
		PA: any[];
		CA: any[];
		BA: any[];
		AU: any[];
		L: any[];
		SRA: any[];
		LG: any[];
		A: any[];
		DOC: any[];
		D: any[];
		DF: any[];
		AN: any[];
		MS: any[];
		AG: any[];
		AB: any[];
		WS: any[];
		CHT: any[];
		ES: any[];
		WT: any[];
		PAP: any[];
		SR: any[];
		S: any[];
		OI: any[];
		T: any[];
		PP: any[];
		DPA: any[];
		CP: any[];
		AUS: any[];
		WB: any[];
		SES: any[];
		TS: any[];
		DCOU: any[];
		DPTW: any[];
		SM: any[];
	};
	projectName;

	iconObject = {
		home_icon: null,
		switch_account: null,
		users_icon: null,
		assets_icon: null,
		drip_icon: null,
		campaign_icon: null,
		analytics_icon: null,
		settings_icon: null,
		sales_icon: null,
		support_icon: null,
		about_us_icon: null,
		workbook_icon: null,
		session_icon: null,
		chat_icon: null,
		course_icon: null,
		pathway_icon: null,
		systemhealth_icon: null,
	};

	constructor(
		private router: Router,
		public appService: AppService,
		private route: ActivatedRoute,
		private permissionsService: NgxPermissionsService,
		private sanitizer: DomSanitizer
	) {
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
			setTimeout(() => {
				this.getAppBranding();
				this.appService.setSiteBranding(this.projectName);
				this.appService.setUserPersonalData();
				this.init();
			}, 300);
			this.active_role = localStorage.getItem('role');
		}
	}

	ngOnInit() {}

	getAppBranding() {
		let userClient = JSON.parse(localStorage.getItem('client'));
		this.appService.getAppBranding(userClient.id).subscribe((res: any) => {
			if (res.success) {
				localStorage.setItem('app_branding', JSON.stringify(res.data));
				if (res?.data?.accent_color) {
					this.appService.setIconWhiteBranding(this.iconObject, res.data.accent_color);
				} else {
					this.appService.setIconWhiteBranding(this.iconObject, '#6513e1');
				}
			}
		});
	}

	ngAfterContentInit() {}
	ngOnDestroy() {}

	init() {
		try {
			var res = JSON.parse(localStorage.getItem('menupermission'));

			this.permissionObject = {
				H: [''],
				POA: [''],
				PA: [''],
				CA: [''],
				BA: [''],
				AU: [''],
				L: [''],
				SRA: [''],
				LG: [''],
				A: [''],
				DOC: [''],
				D: [''],
				DF: [''],
				AN: [''],
				MS: [''],
				AG: [''],
				AB: [''],
				WS: [''],
				CHT: [''],
				ES: [''],
				WT: [''],
				PAP: [''],
				SR: [''],
				S: [''],
				OI: [''],
				T: [''],
				PP: [''],
				DPA: [''],
				CP: [''],
				AUS: [''],
				WB: [''],
				SES: [''],
				TS: [''],
				DCOU: [''],
				DPTW: [''],
				SM: [''],
			};
			var rlist = [];
			this.userData.roles.forEach(function (d) {
				rlist.push(d.role.toUpperCase());
			});
			//console.log(res);
			if (res) {
				for (let d of res) {
					//Need to Add Checks for Document and agents Page
					//Document ==>> DOC
					//Agents ==>> AG
					if (d.module_code == 'DOC' && this.appService?.configurable_feature?.documents == false) {
						continue;
					} else if (d.module_code == 'AG' && this.appService?.configurable_feature?.agents == false) {
						continue;
					} else if (
						['WS', 'CHT', 'WT'].indexOf(d.module_code) > -1 &&
						this.appService?.configurable_feature?.whatsApp == false
					) {
						continue;
					} else if (d.module_code == 'TS' && this.appService?.configurable_feature?.teams == false) {
						continue;
					} else if (d.module_code == 'S' && this.appService?.configurable_feature?.support == false) {
						continue;
					}
					if (d.permission == 'RW' || d.permission == 'R') {
						this.permissionObject[d.module_code] = rlist;
					} else if (d.permission == 'AD') {
						this.permissionObject[d.module_code] = rlist;
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	logout() {
		localStorage.removeItem('isLoggedin');
		let acceptedTerms = localStorage.getItem('acceptedTerms');
		localStorage.clear();
		localStorage.setItem('acceptedTerms', acceptedTerms);
		this.permissionsService.flushPermissions();
	}
	switchUser() {
		if (localStorage.getItem('adminuser')) {
			localStorage.removeItem('adminuser');
			localStorage.removeItem('adminmenupermission');
			localStorage.removeItem('adminrole');
		}
		this.router.navigate(['/login']);
	}

	showHideList(list, otherList) {
		var x = document.getElementById(list);

		if (x && x.style.display == 'none') {
			x.style.display = 'block';
		} else if (x) {
			x.style.display = 'none';
		}
		for (let i in otherList) {
			var ol = document.getElementById(otherList[i]);
			if (ol) {
				ol.style.display = 'none';
			}
		}
		return false;
	}

	ToSUrl() {
		window.open(`${this.userData.Market.tosUrl}`, '_blank');
	}

	PrivacyPolicyUrl() {
		window.open(`${this.userData.Market.privacyPolicyUrl}`, '_blank');
	}

	DPAUrl() {
		window.open(`${this.userData.Market.dpaUrl}`, '_blank');
	}

	CookiePolicyUrl() {
		window.open(`${this.userData.Market.cookiePolicyUrl}`, '_blank');
	}

	// async changeColorAndApply(name, color) {
	// 	let icon: any = await this.appService.applyWhiteBrandingOnTheSVGIcon(color, name);
	// 	let finalIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(icon);
	// 	return finalIcon;
	// }
}
