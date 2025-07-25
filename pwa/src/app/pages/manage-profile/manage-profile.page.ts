import { Component, HostListener, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import { ENV } from 'src/environments/environment';
import { AppService } from 'src/app/app.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LanguageService } from 'src/app/services/language.service';

@Component({
	selector: 'app-manage-profile',
	templateUrl: './manage-profile.page.html',
	styleUrls: ['./manage-profile.page.scss'],
})
export class ManageProfilePage implements OnInit {
	learnerName: string;
	parentClientName: string;

	learnerId: BigInteger;
	phone: string;
	email: string;
	roleList: { role: string } = { role: '' };
	location: string;
	appBrandingInfo: any;
	user: any;
	userClient: any;
	branchName: any;
	appVerion = ENV.appVersion;
	privacyPolicyURL: any;
	tosURL: any;
	imageBaseURL = ENV.imageHost + ENV.imagePath;
	projectType = null;
	showSwitchAccount: boolean = false;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	isMobileView: boolean = false;
	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isResizeTabLandScapView: boolean = false;

	iconObject = {};
	certificateList: any[] = [];
	badgeList: any[] = [];
	WorkbooksCoursesPathwaysCertisBadgesCountListData: any;
	isLangModalOpen = false;

	languages = [
		{ code: 'en', label: 'English (India)' },
		{ code: 'fr', label: 'Français' },
		{ code: 'ar', label: 'العربية' },
	];

	selectedLang = null;
	isLangOpen = false;

	constructor(
		private navCtrl: NavController,
		public appService: AppService,
		private sanitizer: DomSanitizer,
		public toastCtrl: ToastController,
		private renderer: Renderer2,
		public langService: LanguageService
	) {}

	async ngOnInit() {
		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}

		if (localStorage.getItem('otherClientList')) {
			this.showSwitchAccount = true;
		}
		setTimeout(async () => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));

			let hostName = window.location.origin.toLowerCase();
			if (hostName.endsWith(ENV.dripHostPlacholder)) {
				this.projectType = 'drip';
			} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
				this.projectType = 'diwo';
			}
			if (!this.projectType) {
				this.projectType = localStorage.getItem('projectName');
			}
			this.getLearnerCertificateList();
			this.getWorkbooksCoursesPathwaysCertificatesBadgesCount();
			await this.appService.setSiteBranding(this.projectType);
		}, 100);
		this.userClient = localStorage.getItem('user_client') ? JSON.parse(localStorage.getItem('user_client')) : null;
		this.user = (JSON.parse(localStorage.getItem('user')) && JSON.parse(localStorage.getItem('user')).user) || null;

		if (this.user !== null) {
			// if(!this.appService.userPersonalData.account_id){
			// 	await this.appService.setUserPersonalData()
			// }

			// this.learnerName = this.appService?.userPersonalData?.first ? this.appService.userPersonalData.first : null  + ' ' + this.appService?.userPersonalData?.last ? this.appService.userPersonalData.last : null;
			// // this.learnerId = this.user.account_id;
			// this.learnerId = this.appService?.userPersonalData?.account_id ? this.appService.userPersonalData.account_id : null;
			// // this.phone = this.user.phone;
			// this.phone = this.appService?.userPersonalData?.phone ? this.appService.userPersonalData.phone : null;
			// // this.email = this.user.email;
			// this.email = this.appService?.userPersonalData?.email ? this.appService.userPersonalData.email : null;;
			this.userPersonalData();
			this.location = this.user.city;
			this.roleList = this.user.roles;
		}

		if (this.user !== null) {
			if (this.user?.Market?.privacyPolicyUrl !== null) {
				this.privacyPolicyURL = this.user.Market.privacyPolicyUrl;
			} else {
				this.privacyPolicyURL = '#';
			}

			if (this.user?.Market?.tosUrl !== null) {
				this.tosURL = this.user.Market.tosUrl;
			} else {
				this.tosURL = '#';
			}
		}

		if (this.userClient !== null) {
			this.parentClientName = this.userClient.name;
			this.branchName = this.userClient.category;
		}

		if (localStorage.getItem('lang')) {
			this.selectedLang = localStorage.getItem('lang');
		}

		this.getAppBranding();
		this.checkWindowSize();
	}

	async userPersonalData() {
		if (!this.appService.userPersonalData.account_id) {
			await this.appService.setUserPersonalData();
		}
		setTimeout(() => {
			this.learnerName = this.appService?.userPersonalData?.first
				? this.appService.userPersonalData.first
				: null + ' ' + this.appService?.userPersonalData?.last
				? this.appService.userPersonalData.last
				: null;
			this.learnerId = this.appService?.userPersonalData?.account_id
				? this.appService.userPersonalData.account_id
				: null;
			this.phone = this.appService?.userPersonalData?.phone ? this.appService.userPersonalData.phone : null;
			this.email = this.appService?.userPersonalData?.email ? this.appService.userPersonalData.email : null;
		}, 400);
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getUserData() {
		if (localStorage.getItem('getUserData') == 'true') {
			localStorage.setItem('getUserData', 'false');
			let user = (JSON.parse(localStorage.getItem('user')) && JSON.parse(localStorage.getItem('user')).user) || null;

			if (user !== null) {
				this.learnerName = this.appService?.userPersonalData?.first
					? this.appService.userPersonalData.first
					: null + ' ' + this.appService?.userPersonalData?.last
					? this.appService.userPersonalData.last
					: null;
				if (user.client && user.client[0]) {
					this.parentClientName = user.client[0].name;
				}
			}
		}
	}

	onLogout() {
		if (this.userClient !== null && this.user !== null) {
			localStorage.setItem('logout', 'true');
			let payload = {
				ClientId: this.userClient.id,
				UserId: this.user.id,
				Type: this.projectType,
			};

			this.appService.logout(payload).subscribe((res: any) => {
				if (res) {
					setTimeout(async () => {
						await this.appService.clearUserPersonaldata();
						this.navCtrl.navigateForward(['']);
					}, 200);
				}
			});
		}
	}

	aboutUsPage() {
		this.navCtrl.navigateForward(['/about-us']);
	}

	goToToS() {
		if (this.user?.Market?.tosUrl) {
			window.open(`${this.user.Market.tosUrl}`, '_system', 'location=yes');
		} else {
			console.log('Terms of Service URL not available');
		}
	}

	goPrivacyPolicy() {
		if (this.user?.Market?.privacyPolicyUrl) {
			window.open(`${this.user.Market.privacyPolicyUrl}`, '_system', 'location=yes');
		} else {
			console.log('Privacy Policy URL not available');
		}
	}

	gotToSwitchAccount() {
		this.navCtrl.navigateRoot('switch-account');
	}

	getLearnerCertificateList() {
		this.appService.getAllLearnerCertificates().subscribe((res: any) => {
			if (res.success) {
				if (res.data) {
					this.certificateList = [];
					this.badgeList = [];

					for (let item of res.data) {
						if (item.isBadge) {
							if (item.Badge && item.Badge.code && this.appBrandingInfo && this.appBrandingInfo.accent_color) {
								item.Badge.code = item.Badge.code.replaceAll('#6513e1', this.appBrandingInfo.accent_color);
								let finalIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(item.Badge.code);
								item.Badge.finalIcon = finalIcon;
							}
							let payload = {
								learnerAchivmentId: item.id,
								isBadge: item.isBadge,
								BadgeData: item.Badge,
							};

							this.badgeList.push(payload);
						}

						if (item.isCertificate) {
							let payload = {
								learnerAchivmentId: item.id,
								isCertificate: item.isCertificate,
								data: item.data,
							};
							this.certificateList.push(payload);
						}
					}
				}
			}
		});
	}

	getWorkbooksCoursesPathwaysCertificatesBadgesCount() {
		this.appService.getWorkbooksCoursesPathwaysCertificatesBadgesCount().subscribe((res: any) => {
			if (res.success && res.data) {
				this.WorkbooksCoursesPathwaysCertisBadgesCountListData = res.data;
			}
		});
	}

	downloadCertification(learnerAchivmentId) {
		this.presentToast(this.appService.getTranslation('Utils.certificateDownloadMessage'));

		this.appService
			.downloadCertificate(learnerAchivmentId)
			.toPromise()
			.then(
				(res: any) => {
					const link = document.createElement('a');
					link.href = window.URL.createObjectURL(res);
					link.download = 'Certificate.pdf';
					link.click();
					window.URL.revokeObjectURL(link.href);
				},
				(error) => {
					console.error('Error downloading the certificate:', error);
				}
			)
			.catch((err) => {
				console.error('Caught an error:', err);
			});
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024; // Desktop: 1024px and above
		this.isTabletLandscapeView = window.innerWidth > 768 && window.innerWidth < 1024; // Tablet: 768px - 1023px
		this.isMobileView = window.innerWidth < 767; // Mobile: 767px and below
		this.isResizeTabLandScapView = window.innerWidth >= 1024;
	}

	isModalOpen = false;
	selectedBadge: any = null;

	openModal(badge) {
		this.selectedBadge = badge;
		this.isModalOpen = true;
		setTimeout(() => {
			this.setBadgeImageStyles();
		}, 0);
		this.isModalOpen = true;
	}

	closeModal() {
		this.isModalOpen = false;
	}

	setBadgeImageStyles() {
		const badgeImageElement = document.querySelector('.badge-image svg');
		if (badgeImageElement) {
			this.renderer.setStyle(badgeImageElement, 'width', '50%');
			this.renderer.setStyle(badgeImageElement, 'height', '100%');
		}
	}

	openLangModal() {
		this.isLangModalOpen = true;
	}

	closeLangModal() {
		this.isLangModalOpen = false;
	}

	changeLang($event) {
		let lang = $event.target.value;
		this.langService.setLanguage(lang);
		this.isLangModalOpen = false;
		this.isLangOpen = false;
	}

	onLangOpen() {
		this.isLangOpen = true;
	}

	onLangClose() {
		setTimeout(() => {
			this.isLangOpen = false;
		}, 100);
	}
}
