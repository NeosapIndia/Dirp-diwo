import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
	constructor(private translate: TranslateService) {
		this.translate.addLangs(['en', 'fr', 'ar']);
		const savedLang = localStorage.getItem('lang') || translate.getBrowserLang() || 'en';
		this.setLanguage(savedLang);
	}

	setLanguage(lang: string) {
		this.translate.use(lang);
		localStorage.setItem('lang', lang);
		document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
	}

	getCurrentLang() {
		return this.translate.currentLang;
	}
}
