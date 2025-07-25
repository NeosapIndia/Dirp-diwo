import { Component } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { NavController } from '@ionic/angular';
// import { CookieService } from 'ngx-cookie-service';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-logout-page',
	templateUrl: './logout-page.page.html',
	styleUrls: ['./logout-page.page.scss'],
})
export class LogOutPage {
	presentCookie;
	iconObject = {};
	constructor(
		private navCtrl: NavController,
		private route: ActivatedRoute,
		// private cookieService: CookieService,
		private appService: AppService
	) {
		this.route.queryParams.subscribe(async (params: any) => {
			let hostName = window.location.origin.toLowerCase();
			let projectName;
			if (hostName && hostName.endsWith(ENV.dripHostPlacholder)) {
				projectName = 'drip';
				localStorage.setItem('projectName', projectName);
			} else if (hostName && hostName.endsWith(ENV.diwoHostPlacholder)) {
				projectName = 'diwo';
				localStorage.setItem('projectName', projectName);
			}

			if (!projectName) {
				if (params && params.project) {
					if (params.project == 'drip') {
						projectName = 'drip';
					} else if (params.project == 'diwo') {
						projectName = 'diwo';
					} else {
						projectName = 'drip';
					}
					localStorage.setItem('projectName', projectName);
					// this.gotoLoginPage_();
				}
			}

			this.appService.setSiteBranding(projectName);
			this.appService.setIconWhiteBranding(this.iconObject);

			if (params && params.whatsapp_opt_in) {
				localStorage.setItem('projectName', 'drip');
				localStorage.setItem('redirect_opt_in', 'true');
			}

			// console.log('params....', params);

			if (params && params.dripId) {
				localStorage.setItem('projectName', 'drip');
				let navigationExtras: NavigationExtras = {
					queryParams: {
						dripId: params.dripId,
						showSingalPost: true,
						cookieAcceptance: false,
					},
				};

				navigationExtras.skipLocationChange = true;
				this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				//Check Cookies
				// this.presentCookie = this.cookieService.get('cookies');
				// if (!this.presentCookie) {
				// 	let token = this.appService.generateCookieURL();
				// 	this.cookieService.set('cookies', token, 15);
				// 	this.appService.addCookie().subscribe((res: any) => {
				// 		console.log('--------Update Unlisted User Cookei-----');
				// 	});
				// 	// this.navCtrl.navigateForward(["cookie-acceptance"], navigationExtras);
				// 	navigationExtras.queryParams.cookieAcceptance = true;
				// 	navigationExtras.skipLocationChange = true;
				// 	this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				// } else {
				// 	navigationExtras.skipLocationChange = true;
				// 	this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				// }
			} else if (params && params.goto == 'landrover') {
				// console.log('Enter In Page....');
				this.navCtrl.navigateForward(['land-rover']);
			} else if (params && params.drip_code) {
				localStorage.setItem('projectName', 'drip');
				let navigationExtras: NavigationExtras = {
					queryParams: {
						drip_code: params.drip_code,
						showSingalPost: true,
						cookieAcceptance: false,
					},
				};

				navigationExtras.skipLocationChange = true;
				this.navCtrl.navigateForward(['drip-detail'], navigationExtras);

				//Check Cookies
				// this.presentCookie = this.cookieService.get('cookies');
				// if (!this.presentCookie) {
				// 	let token = this.appService.generateCookieURL();
				// 	this.cookieService.set('cookies', token, 15);
				// 	this.appService.addCookie().subscribe((res: any) => {
				// 		console.log('--------Update Unlisted User Cookei-----');
				// 	});
				// 	// this.navCtrl.navigateForward(["cookie-acceptance"], navigationExtras);
				// 	navigationExtras.queryParams.cookieAcceptance = true;
				// 	navigationExtras.skipLocationChange = true;
				// 	this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				// } else {
				// 	navigationExtras.skipLocationChange = true;

				// 	this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				// }
			} else if (params && params.view_workbook) {
				localStorage.setItem('projectName', 'diwo');

				if (params && params.workbookId && params.userId) {
					localStorage.setItem('isTrainer', 'true');
					if (localStorage.getItem('user')) {
						await this.appService.setUserPersonalData();
						let navigationExtras: NavigationExtras = {
							queryParams: {
								view_workbook: true,
								userId: params.userId,
								workbookId: params.workbookId,
							},
						};
						this.navCtrl.navigateForward(['/all-worksheets'], navigationExtras);
					} else {
						let payload = {
							view_workbook: true,
							userId: params.userId,
							workbookId: params.workbookId,
						};
						localStorage.setItem('show_workbook_to_trainer', JSON.stringify(payload));
						this.gotoLoginPage_();
					}
				}
			} else if (params && params.author_preview) {
				localStorage.setItem('projectName', 'diwo');
				if (params && params.moduleId) {
					let navigationExtras: NavigationExtras = {
						queryParams: {
							author_preview: true,
							moduleId: params.moduleId,
						},
					};
					this.navCtrl.navigateForward(['/all-worksheets-preview'], navigationExtras);
				}
			} else if (params && params.workbook_code) {
				localStorage.setItem('projectName', 'diwo');
				localStorage.setItem('sessionCode', params.workbook_code);
				if (localStorage.getItem('user')) {
					await this.appService.setUserPersonalData();
					this.navCtrl.navigateForward(['/mark-present']);
				} else {
					this.navCtrl.navigateForward(['/login-otp']);
					// this.gotoLoginPage_();
				}
			} else if (params && params.trainer_survey) {
				localStorage.setItem('projectName', 'diwo');
				if (params && params.worksheetId) {
					let navigationExtras: NavigationExtras = {
						queryParams: {
							trainer_survey: true,
							worksheetId: params.worksheetId,
						},
					};
					this.navCtrl.navigateForward(['/worksheet'], navigationExtras);
				}
			} else if (params && params.isResetPassword && params.token) {
				localStorage.clear();
				if (params.type == 'drip') {
					localStorage.setItem('projectName', 'drip');
				} else if (params.type == 'diwo') {
					localStorage.setItem('projectName', 'diwo');
				}

				this.appService.setSiteBranding(params.type);
				this.appService.setIconWhiteBranding(this.iconObject);
				localStorage.setItem('session_token', params.token);

				setTimeout(() => {
					let navigationExtras: NavigationExtras = {
						state: {
							pageMode: params.pageMode,
						},
					};

					this.navCtrl.navigateForward(['/reset-password'], navigationExtras);
				}, 1000);
			} else if (!projectName && params && params.project) {
				localStorage.setItem('projectName', params.project.toLowerCase());
				this.gotoLoginPage_();
			} else if (!projectName) {
				localStorage.setItem('projectName', 'drip');
				this.gotoLoginPage_();
			} else {
				this.gotoLoginPage_();
			}
		});
	}

	// gotoLoginPage_() {
	//   if (localStorage.getItem("logout") == "true") {
	//     this.cookieService.delete("cookies");
	//     this.cookieService.delete("oldCookies");
	//     let projectName_ = localStorage.getItem("projectName");
	//     localStorage.clear();

	//     let hostName = window.location.origin.toLowerCase();
	//     let projectName;
	//     if (hostName && hostName.endsWith(ENV.dripHostPlacholder)) {
	//       projectName = 'drip';
	//       localStorage.setItem("projectName", projectName);
	//     } else if (hostName && hostName.endsWith(ENV.diwoHostPlacholder)) {
	//       projectName = 'diwo';
	//       localStorage.setItem("projectName", projectName);
	//     }

	//     if (!projectName && projectName_ && projectName_ !== "null") {
	//       localStorage.setItem("projectName", projectName_);
	//     } else {
	//       localStorage.setItem("projectName", "drip");
	//     }

	//     setTimeout(() => {
	//       window.location.reload();
	//     }, 200);
	//   } else {
	//     this.navCtrl.navigateForward(["/login"]);
	//   }
	// }

	gotoLoginPage_() {
		if (localStorage.getItem('logout') == 'true') {
			let projectName_ = localStorage.getItem('projectName');

			let brandingTemp;
			let language;
			if (localStorage.getItem('loginAppBrading')) {
				brandingTemp = localStorage.getItem('loginAppBrading');
			}

			if (localStorage.getItem('lang')) {
				language = localStorage.getItem('lang');
			}

			localStorage.clear();

			if (brandingTemp) {
				localStorage.setItem('loginAppBrading', brandingTemp);
			}

			if (language) {
				localStorage.setItem('lang', language);
			}

			let hostName = window.location.origin.toLowerCase();
			let projectName;
			if (hostName && hostName.endsWith(ENV.dripHostPlacholder)) {
				projectName = 'drip';
				localStorage.setItem('projectName', projectName);
			} else if (hostName && hostName.endsWith(ENV.diwoHostPlacholder)) {
				projectName = 'diwo';
				localStorage.setItem('projectName', projectName);
			}

			if (!projectName && projectName_ && projectName_ !== 'null') {
				localStorage.setItem('projectName', projectName_);
			} else {
				localStorage.setItem('projectName', 'drip');
			}

			setTimeout(() => {
				window.location.reload();
			}, 200);
		} else {
			this.navCtrl.navigateForward(['/login']);
		}
	}
}
