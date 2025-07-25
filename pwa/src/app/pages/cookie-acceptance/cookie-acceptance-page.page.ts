import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { DragulaService } from 'ng2-dragula';

@Component({
	selector: 'app-cookie-acceptance-page',
	templateUrl: './cookie-acceptance-page.page.html',
	styleUrls: ['./cookie-acceptance-page.page.scss'],
})
export class ManagecookieAcceptancePage implements OnInit {
	policyNames = [];
	userName;
	userDetails;
	incomingPostId: any;
	showSingalPost: any;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	iconObject = {};

	constructor(
		public sanitizer: DomSanitizer,
		private route: ActivatedRoute,
		public appService: AppService,
		public dragulaService: DragulaService,
		public navCtrl: NavController
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 300);
	}

	ngOnInit() {
		// this.userDetails = JSON.parse(localStorage.getItem('user')).user;
		// if(this.userDetails.acceptPolicy == false){
		// let policyNotificationData = JSON.parse(this.userDetails.userPolicyDetails);
		// this.userName = this.userDetails.first + ' ' + this.userDetails.last;
		//   if (policyNotificationData && policyNotificationData.length > 0) {
		//     for (let policy of policyNotificationData) {
		//       for (let key in policy) {
		//         if (!policy[key].acceptedByUser && policy[key].PolicyChangeLogId) {
		//           this.policyNames.push(key);
		//         }
		//       }
		//     }
		//   }
		// }else{
		//   console.log("----");
		//   this.back();
		// }

		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		this.route.queryParams.subscribe((params: any) => {
			this.incomingPostId = params.dripId;
			if (params && params.showSingalPost) {
				this.showSingalPost = params.showSingalPost;
				// this.incomingPostId = parseInt(this.incomingPostId.split("-")[1]);
			}
		});
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	showPolicy(policyName) {}

	acceptPolicyByUser() {
		this.appService.acceptPolicyByUserWithoutlogin().subscribe((res: any) => {
			if (res.success) {
				// let userDetails = JSON.parse(localStorage.getItem('user'));
				// userDetails.user.acceptPolicy = true;
				// localStorage.setItem('user',JSON.stringify(userDetails));
				// this.back();
				let navigationExtras: NavigationExtras = {
					queryParams: {
						dripId: this.incomingPostId,
						showSingalPost: this.showSingalPost,
					},
				};
				this.navCtrl.navigateForward(['drip-detail'], navigationExtras);
			}
		});
	}

	back() {
		this.navCtrl.pop();
	}
}
