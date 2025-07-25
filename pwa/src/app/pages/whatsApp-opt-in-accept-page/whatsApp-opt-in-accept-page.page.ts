import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';

@Component({
	selector: 'app-whatsApp-opt-in-accept-page',
	templateUrl: './whatsApp-opt-in-accept-page.page.html',
	styleUrls: ['./whatsApp-opt-in-accept-page.page.scss'],
})
export class ManageWhatsAppOptInAcceptPage implements OnInit {
	policyNames = [];
	defaultPolicyName = ['Terms and Conditions', 'Privacy Policy', 'Cookie Policy'];
	userName;
	userDetails;
	clientId: any;
	newUser = true;
	iconObject = {};
	constructor(private navCtrl: NavController, private appService: AppService) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
	}

	ngOnInit() {
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	acceptPolicyByUser(flag) {
		let clientId = JSON.parse(localStorage.getItem('user_client')).id;
		this.appService.acceptWhatsAppOptIn(flag, clientId).subscribe(async (res: any) => {
			if (res.success) {
				let userDetails = JSON.parse(localStorage.getItem('user'));
				userDetails.user.acceptPolicy = true;
				userDetails.user.acceptOptInByUser = true;

				if (userDetails?.user) {
					userDetails.user = this.appService.removePersonalData(userDetails.user);
				}

				localStorage.setItem('user', JSON.stringify(userDetails));
				await this.appService.setUserPersonalData();
				localStorage.removeItem('redirect_opt_in');
				this.back();
			}
		});
	}

	back() {
		this.navCtrl.pop();
	}
}
