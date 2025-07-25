import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, ToastController, Platform } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { DragulaService } from 'ng2-dragula';

import { LoadingController } from '@ionic/angular';
@Component({
	selector: 'app-land-rover',
	templateUrl: './land-rover.page.html',
	styleUrls: ['./land-rover.page.scss'],
})
export class LandRoverPage implements OnInit {
	constructor(
		private fb: FormBuilder,
		public sanitizer: DomSanitizer,
		private router: Router,
		private route: ActivatedRoute,
		public appService: AppService,

		public navCtrl: NavController,
		public toastCtrl: ToastController,
		public platform: Platform,
		private loadingCtrl: LoadingController
	) {}

	ngOnInit() {}

	block1() {
		window.open(
			'https://www.landrover.com/experiences/adventure-travel/sub-sahara-africa/index.html',
			'_system',
			'location=yes'
		);
	}

	block2() {
		window.open('https://www.landrover.com/electric/your-choice-of-power.html', '_system', 'location=yes');
	}

	block3() {
		window.open('https://www.landroverusa.com/ownership/wellstoried/erin-true.html', '_system', 'location=yes');
	}
}
