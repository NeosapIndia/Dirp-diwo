import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
	IonContent,
	LoadingController,
	ModalController,
	NavController,
	Platform,
	ToastController,
} from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';

@Component({
	selector: 'app-custom-template',
	templateUrl: './custom-template.page.html',
	styleUrls: ['./custom-template.page.scss'],
})
export class CustomTemplatePage implements OnInit {
	@ViewChild(IonContent) content: IonContent;
	userId: any;
	appBrandingInfo: any;
	imageHost = ENV.imageHost + ENV.imagePath;

	isApiLoad: boolean = false;
	updatedTemplate: any;
	customTemplate: any;
	custTempPlaceholders: any;
	safeHtml: SafeHtml;
	templateType: string;
	incomingPostId: any;
	drip_code: any;
	showSingalPost: any;
	userDetails: any;
	id: any;
	isLoading: boolean;
	resData: any;
	pageClickCount = 0;
	viewedPage: any = [];

	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public toastCtrl: ToastController,
		public route: ActivatedRoute,
		public sanitizer: DomSanitizer,
		private loadingCtrl: LoadingController,
		private router: Router,
		private renderer: Renderer2,
		private elRef: ElementRef
	) {}

	ngOnInit(): void {
		this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
		if (JSON.parse(localStorage.getItem('user'))) {
			this.userDetails = JSON.parse(localStorage.getItem('user')).user;
			this.userId = this.userDetails.id;
		}

		if (this.router.getCurrentNavigation().extras.state) {
			this.resData = this.router.getCurrentNavigation().extras.state.data;
			this.getParamsDripData();
			// console.log('this.resData', this.resData);
		} else {
			this.route.queryParams.subscribe((params: any) => {
				if (params && params.dripId) {
					this.incomingPostId = params.dripId;
				}

				if (params && params.id) {
					this.id = params.id;
					this.getPostByUserId();
				}
			});
		}
	}

	//Main URL
	async getPostByUserId() {
		await this.showLoading();
		this.appService.getDripDataByUId(this.incomingPostId, this.id).subscribe(
			async (data: any) => {
				try {
					if (data.success) {
						let res = {
							data: data.data,
						};
						if (res.data.Post) {
							this.id = res.data.id;
							this.userId = res.data.UserId;
							this.templateType = res.data.Post.tempType;
							this.custTempPlaceholders = res.data.Post.custTempPlaceholders;
							this.customTemplate = res.data.Post.customTemplate;
							let template = this.customTemplate;
							this.custTempPlaceholders.forEach((item) => {
								const placeholder = `{{${item.templatePlaceholdeName}}}`;
								template = template.replace(placeholder, item.inputText);
							});
							this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(template);
							setTimeout(() => {
								this.addEventListeners();
							}, 500);

							if (
								res.data.custTempPageViewed &&
								res.data.custTempPageViewed !== 'null' &&
								res.data.custTempPageViewed !== '' &&
								res.data.custTempPageViewed !== undefined
							) {
								this.viewedPage = [];
								for (let page of res.data.custTempPageViewed) {
									this.viewedPage.push(page);
								}
							}

							// console.log('--this.viewedPage--', this.viewedPage);

							this.appBrandingInfo = res.data.System_branding;
							this.isApiLoad = true;
						}

						this.dismiss();
					} else {
						this.dismiss();
					}
				} catch (error) {
					console.log('---------------getPostByUserId Error.........', error);
					this.dismiss();
				}
			},
			(error: any) => {
				this.dismiss();
			}
		);
	}

	async getParamsDripData() {
		if (this.resData) {
			this.id = this.resData.id;
			this.userId = this.resData.UserId;
			this.templateType = this.resData.Post.tempType;
			this.custTempPlaceholders = this.resData.Post.custTempPlaceholders;
			this.customTemplate = this.resData.Post.customTemplate;
			let template = this.customTemplate;
			this.custTempPlaceholders.forEach((item) => {
				const placeholder = `{{${item.templatePlaceholdeName}}}`;
				template = template.replace(placeholder, item.inputText);
			});
			this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(template);
			setTimeout(() => {
				this.addEventListeners();
			}, 500);

			if (
				this.resData.custTempPageViewed &&
				this.resData.custTempPageViewed !== 'null' &&
				this.resData.custTempPageViewed !== '' &&
				this.resData.custTempPageViewed !== undefined
			) {
				this.viewedPage = [];
				for (let page of this.resData.custTempPageViewed) {
					this.viewedPage.push(page);
				}
			}
			this.appBrandingInfo = this.resData.System_branding;
			this.isApiLoad = true;
		}
	}

	//for html template
	addEventListeners() {
		const container = this.elRef.nativeElement.querySelector('.custom-template-container');
		if (container) {
			this.renderer.listen(container, 'click', (event) => {
				const target = event.target as HTMLElement;
				const anchor = target.closest('[data-target]');
				if (anchor) {
					const targetId = anchor.getAttribute('data-target');
					if (target.classList.contains('close-icon')) {
						this.showSection(targetId, false);
					} else {
						this.showSection(targetId, true);
					}
				}

				if (target.tagName === 'A') {
					const href = target.getAttribute('href');
					// console.log('Anchor tag clicked:', href);
					if (href && href.startsWith('http')) {
						window.open(href, '_blank');
					}
				}
			});
		}
	}

	showSection(targetId: string, shouldIncrement: boolean) {
		const container = this.elRef.nativeElement.querySelector('.custom-template-container');
		if (container) {
			const sections = container.querySelectorAll('div[id^="page"]');
			sections.forEach((section) => {
				section.setAttribute('style', 'display: none;');
			});
			const targetSection = container.querySelector(`#${targetId}`);
			if (targetSection) {
				targetSection.setAttribute('style', 'display: block;');
				this.content.scrollToTop(1000);
				if (shouldIncrement) {
					this.pageClickCount++;
					// console.log('-this.pageClickCount-', this.pageClickCount);
					this.updatePageViewedStatus(targetId);
				}
			}
		}
	}

	// updatePageViewedStatus(targetId) {
	// 	console.log('-this.viewedPage-', this.viewedPage);
	// 	const key = `${targetId}_viewed`;
	// 	let isAlreadyViewed = false;
	// 	this.viewedPage.forEach((page) => {
	// 		if (key in page) {
	// 			isAlreadyViewed = true;
	// 		}
	// 	});
	// 	if (isAlreadyViewed) {
	// 		console.log(`${key} is already viewed`);
	// 		return;
	// 	}
	// 	let payload = {
	// 		[key]: 'YES',
	// 	};
	// 	this.viewedPage.push(payload);
	// 	this.appService.updateCustomPagesViewed(this.id, this.viewedPage).subscribe(
	// 		(res: any) => {
	// 			// if (
	// 			// 	res.custTempPageViewed &&
	// 			// 	res.custTempPageViewed !== 'null' &&
	// 			// 	res.custTempPageViewed !== '' &&
	// 			// 	res.custTempPageViewed !== undefined
	// 			// ) {
	// 			// 	this.viewedPage = [];
	// 			// 	for (let page of res.custTempPageViewed) {
	// 			// 		this.viewedPage.push(page);
	// 			// 	}
	// 			// }
	// 		},
	// 		(err) => {
	// 			console.error('Error updating custom view pages:', err);
	// 		}
	// 	);
	// }

	updatePageViewedStatus(targetId: string) {
		// console.log('-this.viewedPage-', this.viewedPage);
		const key = `${targetId}_viewed`;
		let found = false;
		let isAlreadyViewed = false;

		this.viewedPage.forEach((page) => {
			if (key in page) {
				found = true;

				if (page[key] === 'YES') {
					isAlreadyViewed = true;
				} else {
					page[key] = 'YES';
				}
			}
		});

		if (!found) {
			console.log(`${key} is not found in the array. Skipping update.`);
			return;
		}

		if (isAlreadyViewed) {
			console.log(`${key} is already viewed. No need to call the API.`);
			return;
		}

		this.appService.updateCustomPagesViewed(this.id, this.viewedPage).subscribe(
			(res: any) => {
				console.log('Custom page viewed status updated:', res);
			},
			(err) => {
				console.error('Error updating custom view pages:', err);
			}
		);
	}

	back() {
		this.navCtrl.pop();
	}

	doRefresh(e) {
		e.target.complete();
	}

	async showLoading(message?: string) {
		this.isLoading = true;
		const loading = await this.loadingCtrl.create({});
		loading.present();
		return;
	}

	async dismiss() {
		setTimeout(async () => {
			this.isLoading = false;
			return await this.loadingCtrl.dismiss();
		}, 100);
		return;
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
}
