import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-policy-notification-page',
	templateUrl: './policy-notification-page.page.html',
	styleUrls: ['./policy-notification-page.page.scss'],
})
export class ManagePolicyNotificationPage implements OnInit {
	policyNames = [];
	defaultPolicyName = ['Terms and Conditions', 'Privacy Policy', 'Cookie Policy'];
	userName;
	userDetails;
	clientId: any;
	newUser = true;
	appBrandingInfo: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	policies: any;
	isExistingUser: boolean;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	iconObject = {};

	constructor(private navCtrl: NavController, public appService: AppService) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit() {
		this.checkUserIsExistingOrNot();
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);
		this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		this.clientId = JSON.parse(localStorage.getItem('user_client')).id;
		if (
			this.userDetails.acceptPolicy == false &&
			this.userDetails.userPolicyDetails &&
			this.userDetails.userPolicyDetails != null &&
			this.userDetails.userPolicyDetails != ''
		) {
			this.newUser = false;
			let policyNotificationData = JSON.parse(this.userDetails.userPolicyDetails);
			this.userName = this.appService?.userPersonalData?.first
				? this.appService.userPersonalData.first
				: null + ' ' + this.appService?.userPersonalData?.last
				? this.appService.userPersonalData.last
				: null;
			if (policyNotificationData && policyNotificationData.length > 0) {
				for (let policy of policyNotificationData) {
					for (let key in policy) {
						if (!policy[key].acceptedByUser && policy[key].PolicyChangeLogId) {
							this.policyNames.push(key);
							const str_policy_name = this.policyNames.toString();
							this.policies = this.removeLastComma(str_policy_name);
						}
					}
				}
			}
		} else if (this.userDetails.acceptPolicy == false) {
			this.newUser = true;
			this.policyNames = [];
			this.policyNames = this.defaultPolicyName;
			const str_policy_name = this.policyNames.toString();
			this.policies = this.removeLastComma(str_policy_name);
		} else {
			this.back();
		}
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	showPolicy(policyName) {
		if (
			policyName == 'Terms and Conditions' &&
			this.userDetails &&
			this.userDetails.Market &&
			this.userDetails.Market.tosUrl
		) {
			window.open(`${this.userDetails.Market.tosUrl}`, '_system', 'location=yes');
		} else if (
			policyName == 'Privacy Policy' &&
			this.userDetails &&
			this.userDetails.Market &&
			this.userDetails.Market.privacyPolicyUrl
		) {
			window.open(`${this.userDetails.Market.privacyPolicyUrl}`, '_system', 'location=yes');
		} else if (
			policyName == 'Cookie Policy' &&
			this.userDetails &&
			this.userDetails.Market &&
			this.userDetails.Market.cookiePolicyUrl
		) {
			window.open(`${this.userDetails.Market.cookiePolicyUrl}`, '_system', 'location=yes');
		}
	}

	acceptPolicyByUser() {
		let payload = {
			list: this.policyNames,
		};

		this.appService.acceptPolicyByUser(this.clientId, payload).subscribe(async (res: any) => {
			if (res.success) {
				let userDetails = JSON.parse(localStorage.getItem('user'));
				userDetails.user.acceptPolicy = true;

				if (userDetails?.user) {
					userDetails.user = this.appService.removePersonalData(userDetails.user);
				}

				localStorage.setItem('user', JSON.stringify(userDetails));
				await this.appService.setUserPersonalData();
				if (localStorage.getItem('singleDripWithLogin')) {
					let navigationExtras: NavigationExtras = {
						queryParams: {
							dripId: parseInt(localStorage.getItem('singleDripWithLogin')),
							showSingalPost: true,
						},
					};
					this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
				} else {
					if (this.appService.type == 'drip') {
						this.back();
					} else {
						this.navCtrl.navigateForward(['tabs/all-modules']);
					}
				}
			}
		});
	}

	back() {
		this.navCtrl.pop();
	}

	removeLastComma(str) {
		let string = str;
		const lastIndex = str.lastIndexOf(',');
		if (lastIndex !== -1) {
			let string = str.slice(0, lastIndex) + ' ' + 'and' + ' ' + str.slice(lastIndex + 1);
			return string;
		}
		return string;
	}

	checkUserIsExistingOrNot() {
		let userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.appService.checkUserIsExistingOrNot(userId).subscribe((res: any) => {
			if (res.success) {
				if (res.message == 'Existing User') {
					this.isExistingUser = true;
				} else {
					this.isExistingUser = false;
				}
			}
		});
	}
}
