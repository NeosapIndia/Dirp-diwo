import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController, NavController, Platform, ToastController } from '@ionic/angular';
import { AppConfig } from 'src/app/app.config';
import * as moment from 'moment';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-about-us',
	templateUrl: './about-us.page.html',
	styleUrls: ['./about-us.page.scss'],
})
export class AboutUsPage {
	aboutUsInfo;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	appVersion;

	constructor(
		public http: HttpClient,
		public platform: Platform,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public appService: AppService,
		public plt: Platform,
		private route: ActivatedRoute,
		private router: Router,
		public config: AppConfig
	) {
		this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.appVersion = ENV.appVersion;
	}

	getAppBrancding() {
		if (localStorage.getItem('appBrandingAboutUsPage') == 'True') {
			localStorage.setItem('appBrandingAboutUsPage', 'false');
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		}
	}

	ionViewWillEnter() {}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	back() {}
}
