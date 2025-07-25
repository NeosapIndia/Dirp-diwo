import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { IonContent, NavController, Platform, ToastController } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
// import { OverlayEventDetail } from '@ionic/core/components';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from 'src/app/services/language.service';
import panzoom from '@panzoom/panzoom';

@Component({
	selector: 'app-all-worksheets',
	templateUrl: './all-worksheets.page.html',
	styleUrls: ['./all-worksheets.page.scss'],
})
export class SingleWorkbookPage implements OnInit {
	allVideos = [];
	wsData: any = [];
	noteInput = null;

	isRtl: boolean = false;

	@ViewChild(IonContent) content: IonContent;
	backToTop: boolean = false;
	isShowTrainerNote = false;
	showNotesInput = false;
	@ViewChild('swiper', { static: true }) learnerNoteInput: ElementRef<HTMLInputElement>;	
	// @ViewChild('zoomContainer', { static: false }) zoomContainer!: ElementRef<HTMLDivElement>;
	@ViewChildren('zoomContainer') zoomContainers!: QueryList<ElementRef<HTMLDivElement>>;	
	@ViewChild('zoomImage') zoomImageRef: ElementRef;	


	private lastScale = 1;
	private currentScale = 1;
	private lastX = 0;
	private lastY = 0;
	private currentX = 0;
	private currentY = 0;

	@ViewChild('quillEditorRef') quillEditor: any;
	userId: any;
	sessionUserId: any;
	ModuleTypeName: any;
	sessionWorksheetId = 0;
	clientId: any;
	userNote;
	imageHost = ENV.imageHost + ENV.imagePath;
	isTrainer = false;
	appBrandingInfo: any;

	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	isMobileView: boolean = false;

	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isdesktopDetectedView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;

	isSCORM: boolean = false;	
	user: any;
	learnerId: number = 0;
	moduleId: number = 0;
	ScormAssetsData: any[] = []; 

	iconObject = {};
	page = 0;
	perPage: number = 7;
	data: any[] = [];
	totleCount: number = 0;
	sessionData: any = [];
	quillModules: any = {};

	@ViewChild(IonContent) WorksheetContent: IonContent;	
	scrollPosition: any = 0;
	isApiCall: boolean = false;
	isNavigateFromWorksheet: boolean = false;
	disableInfiniteScroll: boolean = false;
	comingBack: boolean = false;
	scrollPositionAfterNavigate: any = 0;
	checkVideoStatusIntervel: any;
	panzoomInstance: any;
	panzoomInstances: { [index: number]: any } = {}; // Map of instances by index
	zoomResetTimeout: any;
	isZoomed: boolean = false;
	movedToBody: boolean = false;

	constructor(
		public navCtrl: NavController,
		private platform: Platform,
		public appService: AppService,
		public toastCtrl: ToastController,
		public route: ActivatedRoute,
		public sanitizer: DomSanitizer,
		private languageService: LanguageService
	) {
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView = this.appService.isdesktopView;
			this.user = (JSON.parse(localStorage.getItem('user')) && JSON.parse(localStorage.getItem('user')).user) || null;
            if (this.user !== null) {			
				this.userPersonalData();			
			}
			this.isdesktopDetectedView = this.appService.isdesktopView;
			this.isTabletLandscapeDetectedView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
		}, 100);

		this.checkWindowSize();
	}

	ionViewWillEnter() {
		this.userId = parseInt(localStorage.getItem('user_id'));
		this.sessionUserId = this.route.snapshot.queryParams['workbookId'];
		this.ModuleTypeName = this.route.snapshot.queryParams['moduleType'];
		// if (this.route.snapshot.queryParams['view_workbook']) {
		//   this.isTrainer = true;
		//   localStorage.setItem('isTrainer', 'true');
		// }

		console.log('this.ModuleTypeName in ion view will enter', this.ModuleTypeName);

		
		if (localStorage.getItem('isTrainer') == 'true') {
			this.isTrainer = true;
		} else {
			localStorage.setItem('isTrainer', 'false');
			this.userId = parseInt(localStorage.getItem('user_id'));
			this.clientId = JSON.parse(localStorage.getItem('user_client')).id || null;
		}
		if (this.platform.is('desktop')) {
			this.isMobile = false;
		}

		const lang = this.languageService.getCurrentLang();
		this.isRtl = lang === 'ar' ? true : false;

		this.getAppBranding();

		// Check if coming back from another page
		if (this.comingBack) {
			this.comingBack = false;
			this.disableInfiniteScroll = true;
			this.isNavigateFromWorksheet = true;

			// Fetch data up to the last loaded page
			this.wsData = [];
			this.isApiCall = false; // Reset API call flag
			for (let i = 0; i <= this.page; i++) {
				this.page = i; // Set the current page
				this.getAllworksheets();
			}

			// Restore the scroll position
			setTimeout(() => {
				this.WorksheetContent.scrollToPoint(0, this.scrollPosition, 0);
			}, 100);

			return;
		}

		this.wsData = [];
		this.page = 0;
		// if (this.wsData.length == 0) {
		this.getAllworksheets();
		this.getScormWorkbook();
		// }
	}	

	ngAfterViewInit() {
		this.quillModules = {
			toolbar: {
				container: '#custom-toolbar',
				handlers: {
					undo: () => this.undoChange(),
					redo: () => this.redoChange()
				}
			},
			history: {
				delay: 1000,
				maxStack: 100,
				userOnly: true
			}
		};

		if (this.zoomImageRef && this.zoomImageRef.nativeElement) {
			const img = this.zoomImageRef.nativeElement;
			let startScale = 1, startX = 0, startY = 0;
			let ongoing = false;

			img.addEventListener('touchstart', (e: TouchEvent) => {
				if (e.touches.length === 2) {
					ongoing = true;
					const [p1, p2] = [e.touches[0], e.touches[1]];
					startScale = this.currentScale;
					startX = this.currentX;
					startY = this.currentY;
				}
			});

			img.addEventListener('touchmove', (e: TouchEvent) => {
				if (e.touches.length === 2 && ongoing) {					
					if (this.currentScale > 1) e.preventDefault();
					const [p1, p2] = [e.touches[0], e.touches[1]];
					const dx = p2.clientX - p1.clientX;
					const dy = p2.clientY - p1.clientY;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (!img.dataset.startDistance) {
						img.dataset.startDistance = distance.toString();
					}

					// const scale = distance / +img.dataset.startDistance * startScale;
					const scaleFactor = distance / +img.dataset.startDistance;
					const adjustedScale = startScale + (scaleFactor - 1) * 0.5; // 0.5 is damping factor (adjust to taste)
					this.currentScale = Math.max(1, Math.min(adjustedScale, 4));

					// this.currentScale = Math.max(1, Math.min(scale, 4));

					if (this.currentScale > 1 && !img.classList.contains('zoom-overlay')) {
						img.classList.add('zoom-overlay');

						this.isZoomed = true; 

						// ✅ Move to body to simulate fullscreen (optional)
						document.body.appendChild(img);

						// ✅ Hide other images
						this.zoomContainers.forEach((ref) => {
							const otherImg = ref.nativeElement.querySelector('img');
							if (otherImg && otherImg !== img) {
								otherImg.classList.add('hide-during-zoom');
							}
						});
					} else {
						img.classList.remove('zoom-overlay');
					}

					const midX = (p1.clientX + p2.clientX) / 2;
					const midY = (p1.clientY + p2.clientY) / 2;

					img.style.transformOrigin = `${midX}px ${midY}px`; 

					if (!img.dataset.startMidX) {
						img.dataset.startMidX = midX.toString();
						img.dataset.startMidY = midY.toString();
						img.dataset.startImgX = this.currentX.toString();
						img.dataset.startImgY = this.currentY.toString();
					}
					this.currentX = startX + (midX - +img.dataset.startMidX);
					this.currentY = startY + (midY - +img.dataset.startMidY);

					img.style.transform = `scale(${this.currentScale}) translate(${this.currentX / this.currentScale}px, ${this.currentY / this.currentScale}px)`;
				}
			}, { passive: false });

			img.addEventListener('touchend', (e: TouchEvent) => {
				if (e.touches.length < 2) {
					ongoing = false;
					this.currentScale = 1;
					this.currentX = 0;
					this.currentY = 0;
					this.isZoomed = false; 

					img.style.transition = 'transform 0.3s';
					img.style.transform = 'scale(1) translate(0,0)';
					img.classList.remove('zoom-overlay');					

					// ✅ Restore all other images
					this.zoomContainers.forEach((ref) => {
						const otherImg = ref.nativeElement.querySelector('img');
						if (otherImg) {
							otherImg.classList.remove('hide-during-zoom');
						}
					});

					setTimeout(() => {
						img.style.transition = '';
					}, 300);

					delete img.dataset.startDistance;
					delete img.dataset.startMidX;
					delete img.dataset.startMidY;
					delete img.dataset.startImgX;
					delete img.dataset.startImgY;
				}
			});

			document.addEventListener('touchend', () => {
				clearTimeout(this.zoomResetTimeout);
				this.zoomResetTimeout = setTimeout(() => {
					this.zoomContainers?.forEach((ref) => {
						const otherImg = ref.nativeElement.querySelector('img');
						if (otherImg) {
							otherImg.classList.remove('hide-during-zoom');
							otherImg.classList.remove('zoom-overlay');
							otherImg.style.transition = 'transform 0.3s';
							otherImg.style.transform = 'scale(1) translate(0,0)';
							setTimeout(() => {
								otherImg.style.transition = '';
							}, 300);
						}
					});
				}, 100);
			});

		}
	}

	onImageLoad(index: number): void {
		const container = this.zoomContainers.toArray()[index];
		if (!container) return;

		const imgEl = container.nativeElement.querySelector('img');
		if (!imgEl) return;

		imgEl.style.transform = 'scale(1) translate(0,0)';
		imgEl.style.transition = '';

		let currentScale = 1;
		let currentX = 0;
		let currentY = 0;
		let startScale = 1;
		let startX = 0;
		let startY = 0;
		let ongoing = false;

		imgEl.addEventListener('touchstart', (e: TouchEvent) => {
			if (e.touches.length === 2) {
				ongoing = true;
				const [p1, p2] = [e.touches[0], e.touches[1]];
				startScale = currentScale;
				startX = currentX;
				startY = currentY;

				imgEl.dataset.startDistance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY).toString();
				imgEl.dataset.startMidX = ((p1.clientX + p2.clientX) / 2).toString();
				imgEl.dataset.startMidY = ((p1.clientY + p2.clientY) / 2).toString();
			}
		});

		imgEl.addEventListener('touchmove', (e: TouchEvent) => {
			if (e.touches.length === 2 && ongoing) {		

				const [p1, p2] = [e.touches[0], e.touches[1]];
				const dx = p2.clientX - p1.clientX;
				const dy = p2.clientY - p1.clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const scale = distance / +imgEl.dataset.startDistance * startScale;
				currentScale = Math.max(1, Math.min(scale, 4));

				if (currentScale > 1) e.preventDefault();

				if (currentScale > 1 && !imgEl.classList.contains('zoom-overlay')) {
					imgEl.classList.add('zoom-overlay');	
					this.isZoomed = true; 

					if (!this.movedToBody) {
						document.body.appendChild(imgEl);
						this.movedToBody = true; // ✅ prevent future re-append
					}
				} else if (currentScale === 1 && this.movedToBody) {
					imgEl.classList.remove('zoom-overlay');
					container.nativeElement.appendChild(imgEl);
					this.movedToBody = false; // ✅ reset
				}

				if (currentScale > 1) {
					document.body.style.overflow = 'hidden';
				} else {
					document.body.style.overflow = '';
				}


				const midX = (p1.clientX + p2.clientX) / 2;
				const midY = (p1.clientY + p2.clientY) / 2;

				imgEl.style.transformOrigin = `${midX}px ${midY}px`; 

				currentX = startX + (midX - +imgEl.dataset.startMidX);
				currentY = startY + (midY - +imgEl.dataset.startMidY);

				imgEl.style.transform = `scale(${currentScale}) translate(${currentX / currentScale}px, ${currentY / currentScale}px)`;
			}
		}, { passive: false });

		imgEl.addEventListener('touchend', (e: TouchEvent) => {
			if (e.touches.length < 2) {
				ongoing = false;
				currentScale = 1;
				currentX = 0;
				currentY = 0;
				this.isZoomed = false; 

				imgEl.style.transition = 'transform 0.3s ease';
				imgEl.style.transform = 'scale(1) translate(0,0)';				

				if (this.movedToBody) {
					imgEl.classList.remove('zoom-overlay');
					container.nativeElement.appendChild(imgEl);
					this.movedToBody = false;
				}

				setTimeout(() => {
					imgEl.style.transition = '';
				}, 300);

				delete imgEl.dataset.startDistance;
				delete imgEl.dataset.startMidX;
				delete imgEl.dataset.startMidY;
			}
		});
	}

	zoomIn(index: number): void {
		this.panzoomInstances[index]?.zoomIn();
	}

	zoomOut(index: number): void {
		this.panzoomInstances[index]?.zoomOut();
	}

	resetZoom(index: number): void {
		const instance = this.panzoomInstances[index];
		if (instance) {
			instance.moveTo(0, 0);
			instance.zoomAbs(0, 0, 1);
		}
	}

	initPanzoom(): void {
		if (!this.zoomContainers || this.zoomContainers.length === 0) return;

		this.zoomContainers.forEach((containerRef, index) => {
			const container = containerRef.nativeElement;
			const imgEl = container.querySelector('img');
			if (!imgEl) return;

			// Dispose existing instance
			if (this.panzoomInstances[index]) {
				this.panzoomInstances[index].dispose?.();
			}

			const panzoomInstance = panzoom(imgEl, {
				maxZoom: 3,
				minZoom: 1,
				zoomSpeed: 0.065,
				contain: false,
				bounds: false
			});

			this.panzoomInstances[index] = panzoomInstance;

			imgEl.addEventListener('dblclick', (e: Event) => {				
				if (this.currentScale > 1) e.preventDefault();
			});

			let lastTouchDistance = 0;

			imgEl.addEventListener('touchmove', (e: TouchEvent) => {
				if (e.touches.length === 2) {
					if (this.currentScale > 1) e.preventDefault();
					const dx = e.touches[0].clientX - e.touches[1].clientX;
					const dy = e.touches[0].clientY - e.touches[1].clientY;
					lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
				}
			});

			imgEl.addEventListener('touchend', () => {
				if (lastTouchDistance > 0) {
					this.resetZoom(index);
					lastTouchDistance = 0;
				}
			});

			console.log(`Panzoom initialized on image via initPanzoom for index ${index}`);
		});
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	async userPersonalData() {
		if (!this.appService.userPersonalData.account_id) {
			await this.appService.setUserPersonalData();
		}
	
	this.learnerId = this.appService?.userPersonalData?.account_id
		? this.appService.userPersonalData.account_id
		: null;
					
	}	

	getScormWorkbook(){	
		console.log('this.ModuleTypeName', this.ModuleTypeName);		
		if(this.ModuleTypeName == 'SCORM') {
			this.appService.getUsersScormWorkbook(this.sessionUserId).subscribe((res: any) => {
				if (res.success) {				
					console.log('this.data in getScormWorkbook', res.data);

					if (this.user !== null) {			
						this.userPersonalData();	
						this.learnerId = this.learnerId;		
					}

					this.isSCORM = res.data.isSCORM;	

					this.appService.moduleId = res.data.id;
					this.appService.learnerId = this.learnerId;
					this.appService.sessionUserID = this.sessionUserId;	
					
					if(res.data && res.data.ModuleStatus === 'Not Started') {
						this.appService.initialLaunchDate = new Date().toISOString();						
					} else if (res.data && res.data.ModuleStatus === 'In Progress') {
						this.appService.recentLaunchDate =new Date().toISOString();						
					}					

					// console.log('this.learnerId', this.learnerId);
					// console.log('this.sessionUserId', this.sessionUserId);					

					const originalUrl = res.data.launchFile;

					console.log('originalUrl', originalUrl);
					
					const urlObj = new URL(originalUrl);										
					const scormPath = urlObj.pathname.replace( `${ENV.imagePath}` + 'uploads/scorm_modules/', '');				
					const proxyUrl = `/scorm-launch${scormPath}${urlObj.search}`;

					console.log('proxyUrl', proxyUrl);

					// Update asset with Scrom Details Extracted content 
					if (res.data.isSCORM === true && res.data.extractedZipFilePath) {

						let scormAsset = {					
							fileName: res.data.fileName,
							type: res.data.type,
							isSCORM: res.data.isSCORM,
							extractedZipFilePath: res.data.extractedZipFilePath,
							launchFile: res.data.launchFile,  // for dev 
							// launchFile: proxyUrl,		// for local				
							title: res.data.title,
						};

						this.ScormAssetsData.push(scormAsset);
						console.log('ScormAssetsData', this.ScormAssetsData);
						// console.log('ScormAssetsData[0].launchFile', this.ScormAssetsData[0].launchFile);
						// console.log('typeOf(ScormAssetsData[0].launchFile)', typeof(this.ScormAssetsData[0].launchFile))
					}				
				}
			});		
		}
	}	

	getAllworksheets() {
		if(this.ModuleTypeName != 'SCORM') {
			this.appService.getUsersAllWorksheets(this.sessionUserId, this.perPage, this.page).subscribe((res: any) => {
				if (res.success) {
					this.data = res.data;
					this.totleCount = parseInt(res.count);
					this.wsData = this.wsData.concat(this.data);
					this.sessionData = res.session_detail;
					let index = 0;

					if (this.checkVideoStatusIntervel) {
						clearInterval(this.checkVideoStatusIntervel);
					}

					let videoIntervalFlag = false;
					for (let item of this.wsData) {
						if (item.description) {
							setTimeout(() => {
								this.displayTextOrHyperLink(item.description, item.id, index);
								index++;
							}, 100);
						}

						if (item && item.activityTemplate) {
							const key = this.appService.GetLanguageKey(item.activityTemplate);
							if (key) {
								item.activityTemplate = this.appService.getTranslation(`Utils.Database.${key}`);
							}
						}

						if (item.type == 'Learning Content' && item.SessionAssets && item.SessionAssets.length > 0) {
							if (item.SessionAssets[0].type == 'Video' && item.worksheetStatus != 'Completed') {
								videoIntervalFlag = true;
							}
						}
					}

					if (videoIntervalFlag) {
						this.checkVideoCompleteStatus();
					}

					setTimeout(() => {
						this.WorksheetContent.scrollToPoint(0, this.scrollPosition, 0);
					}, 100);

					this.isApiCall = true;
				}
			});
		}
	}

	checkVideoCompleteStatus() {
		this.checkVideoStatusIntervel = setInterval(() => {
			let client_percentage = JSON.parse(localStorage.getItem('user_client'))?.percentage
				? JSON.parse(localStorage.getItem('user_client'))?.percentage
				: 0;

			let percentage = this.appService.videoPlayInPercentage * 100;
			console.log('percentage', percentage);

			for (let item of this.wsData) {
				if (item.id == this.appService.videoLogId) {
					if (percentage >= client_percentage) {
						item.worksheetStatus = 'Completed';
					}
				}
			}
		}, 1000);
	}

	ionViewDidLeave() {
		if (this.checkVideoStatusIntervel) {
			clearInterval(this.checkVideoStatusIntervel);
		}
	}

	goToPrintPage() {
		this.appService.pauseVideo(true);
		let navigationExtras: NavigationExtras = { queryParams: { workbookId: this.sessionUserId } };
		this.navCtrl.navigateForward(['all-worksheets-print'], navigationExtras);
	}

	back() {
		this.appService.pauseVideo(true);

		this.navCtrl.pop();
	}

	enterLearnerNotes(i) {
		if (this.noteInput == '' || this.noteInput == null) {
			return;
		}
		this.wsData[i].userNote = this.noteInput;
		this.noteInput = null;
	}

	async doRefresh(e) {
		this.scrollPosition = 0;
		await this.appService.pauseVideo(true);
		setTimeout(() => {
			this.page = 0;
			this.wsData = [];
			this.getAllworksheets();
			this.getScormWorkbook();
			e.target.complete();
		}, 500);
	}

	paginateArray() {
		console.log('---paginateArray---');
		this.page++;
		this.data = [];
		this.getAllworksheets();
		this.getScormWorkbook();
	}

	loadMore(event) {
		if (this.disableInfiniteScroll) {
			setTimeout(() => {
				event.target.complete();
				this.disableInfiniteScroll = false;
				return;
			}, 1000);
		}
		console.log('-this.scrollPosition---comingBack-0', this.scrollPosition);
		setTimeout(() => {
			this.paginateArray();
			event.target.complete();
		}, 1000);
	}

	getScrollPos(pos: any) {
		pos = pos.detail.scrollTop;
		if (!this.isNavigateFromWorksheet) {
			this.scrollPosition = pos;
		} else {
			this.scrollPosition = this.scrollPosition;
		}

		if (pos > this.platform.height()) {
			this.backToTop = true;
		} else {
			this.backToTop = false;
		}
	}

	gotToTop() {
		this.content.scrollToTop(1000);
	}

	navigateToWorksheet(id, index) {
		this.WorksheetContent.getScrollElement().then((scrollElement) => {
			this.scrollPosition = 0;
			this.scrollPosition = scrollElement.scrollTop;
			this.scrollPositionAfterNavigate = this.scrollPosition;
			this.appService.pauseVideo(true);
			if (this.allVideos && this.allVideos.length > 0) {
				for (let player of this.allVideos) {
					player.pause();
				}
			}

			this.appService.checkUserHaveSessionAccess(null, id).subscribe(
				(res: any) => {
					if (res.success) {
						this.comingBack = true;
						let navigationExtras: NavigationExtras = { queryParams: { worksheetId: id, index: index } };
						this.navCtrl.navigateForward(['worksheet'], navigationExtras);
					}
				},
				(err) => {
					const key = this.appService.GetLanguageKey(err.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
					this.navCtrl.navigateRoot('tabs/all-modules');
				}
			);
		});
	}

	showTrainerNote(index) {
		this.wsData[index].isShowTrainerNote = !this.wsData[index].isShowTrainerNote;
	}

	addEditLearnerNote(item, index) {
		this.WorksheetContent.getScrollElement().then((scrollElement) => {
			this.scrollPosition = scrollElement.scrollTop;

			this.showNotesInput = true;
			this.sessionWorksheetId = item.id;
			this.userNote = item.userNote;
		});
	}

	cancel() {
		let index = 0;
		for (let item of this.wsData) {
			if (item.description) {
				setTimeout(() => {
					this.displayTextOrHyperLink(item.description, item.id, index);
					index++;
				}, 100);
			}
		}

		this.showNotesInput = false;
		setTimeout(() => {
			this.WorksheetContent.scrollToPoint(0, this.scrollPosition, 0);
		}, 50);
	}

	saveLearnerNote() {
		let payload = {
			userNote: this.userNote,
		};

		this.appService.updateUserNote(this.sessionWorksheetId, payload).subscribe(
			(res: any) => {
				this.wsData = [];
				this.page = 0;
				this.getAllworksheets();
				this.getScormWorkbook();
				this.showNotesInput = false;
				setTimeout(() => {
					this.WorksheetContent.scrollToPoint(0, this.scrollPosition, 0);
				}, 50);
				//Update on the Localstorge
				if (localStorage.getItem(this.sessionWorksheetId.toString())) {
					let data = JSON.parse(localStorage.getItem(this.sessionWorksheetId.toString()));
					data.userNote = this.userNote;
					localStorage.setItem(this.sessionWorksheetId.toString(), JSON.stringify(data));
				}
			},
			(err) => {
				const key = this.appService.GetLanguageKey(err.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
				this.navCtrl.navigateRoot('tabs/all-modules');
			}
		);
	}

	changeFlag(index, type) {
		if (type == 'Fav') {
			this.wsData[index].isFav = !this.wsData[index].isFav;
		} else if (type == 'Bookmark') {
			this.wsData[index].isBookmark = !this.wsData[index].isBookmark;
		} else if (type == 'Imp') {
			this.wsData[index].isImp = !this.wsData[index].isImp;
		} else if (type == 'Group Activty') {
			this.wsData[index].isGroupActivty = !this.wsData[index].isGroupActivty;
		}
		let payload = {
			isFav: this.wsData[index].isFav,
			isImp: this.wsData[index].isImp,
			isGroupActivty: this.wsData[index].isGroupActivty,
			isBookmark: this.wsData[index].isBookmark,
		};
		this.appService.updateUserDiwoFlag(this.wsData[index].id, payload).subscribe(
			(res: any) => {
				//Check and Update
				if (localStorage.getItem(this.wsData[index].id)) {
					let data = JSON.parse(localStorage.getItem(this.wsData[index].id));
					if (data) {
						data.isFav = this.wsData[index].isFav;
						data.isImp = this.wsData[index].isImp;
						data.isGroupActivty = this.wsData[index].isGroupActivty;
						data.isBookmark = this.wsData[index].isBookmark;
						localStorage.setItem(this.wsData[index].id, JSON.stringify(data));
					}
				}
			},
			(err) => {
				const key = this.appService.GetLanguageKey(err.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
				this.navCtrl.navigateRoot('tabs/all-modules');
			}
		);
	}
	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	displayTextOrHyperLink(input, id, index) {
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		const contentDiv = document.getElementById(`All_module_description${id}`);
		let htmlContent = '';
		let linkIdCounter = 0;

		htmlContent = input.replace(urlPattern, (url) => {
			linkIdCounter++;
			return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}">${url}</a>`;
		});

		if (contentDiv) {
			contentDiv.innerHTML = htmlContent;

			contentDiv.addEventListener('click', (event) => {
				const target = event.target as HTMLElement;
				if (target.tagName !== 'A') {
					this.navigateToWorksheet(id, index);
				}
			});
		}

		for (let i = 1; i <= linkIdCounter; i++) {
			const linkElement = document.getElementById(`dynamic-hyper-link-${i}`);
			if (linkElement) {
				linkElement.onclick = (event) => {
					event.preventDefault();
					const url = linkElement.getAttribute('href');
					if (url) {
						window.open(url, '_blank');
					}
				};
			}
		}
	}

	hasVideo(assets: any[]): boolean {
		for (const asset of assets) {
			if (asset.type === 'Video') {
				return true;
			}
		}
		return false;
	}

	sesionRecordingLink(link) {
		window.open(`${link}`, '_blank');
	}

	ngOnInit() {
		this.checkWindowSize();
	}

	//Screen Responsive Code
	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		this.isdesktopView = window.innerWidth >= 1024;
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024;
		this.isMobileView = window.innerWidth < 767;
	}

	
	undoChange() {
		console.log('UNDO CLICKED');
		const editor = this.quillEditor?.quillEditor;
		if (editor) {
			editor.history.undo();
		}
	}

	redoChange() {
		console.log('REDO CLICKED');
		const editor = this.quillEditor?.quillEditor;
		if (editor) {
			editor.history.redo();
		}
	}
}
