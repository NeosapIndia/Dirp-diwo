import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from './app.service';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss'],
})
export class AppComponent {
	appBrandingInfo: any;
	iconObject = {};

	// data = {
	// 	Utils: {
	// 		loadingMoreData: 'Loading more data..',
	// 	},
	// };

	// arabic = [
	// 	{
	// 		Key: 'loadingMoreData',
	// 		Value: 'Loading more data..',
	// 		Translation: 'جارٍ تحميل المزيد من البيانات...',
	// 	},
	// ];

	constructor(public translate: TranslateService, public platform: Platform, public appService: AppService) {
		this.translate.setDefaultLang(localStorage.getItem('lang') || 'en');
		this.translate.use(localStorage.getItem('lang') || 'en');
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
		}, 100);
		this.appService.setIconWhiteBranding(this.iconObject, '#6513e1');

		// this.arabic.forEach(({ Key, Valeur }) => {
		// 	if (this.data.Utils.hasOwnProperty(Key)) {
		// 		this.data.Utils[Key] = Valeur;
		// 	}
		// });
	}
}
