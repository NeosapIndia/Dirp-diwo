import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, HostListener, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
	AlertController,
	IonContent,
	LoadingController,
	NavController,
	Platform,
	ToastController,
} from '@ionic/angular';
import {
	AdvancedPieChartComponent,
	BarHorizontalComponent,
	BarVerticalComponent,
	LineChartComponent,
	PieChartComponent,
} from '@swimlane/ngx-charts';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { curveLinear, curveNatural } from 'd3-shape';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import phone from 'phone';
import moment from 'moment';
import { NgxWheelComponent } from 'ngx-wheel';
import { map, switchMap } from 'rxjs/operators';
import { Location } from '@angular/common';
import panzoom from '@panzoom/panzoom';

@Component({
	selector: 'app-worksheet',
	templateUrl: './worksheet.page.html',
	styleUrls: ['./worksheet.page.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class WorksheetPage {
	@ViewChild(BarHorizontalComponent) chartInstance?: BarHorizontalComponent;
	@ViewChild(BarVerticalComponent) chartInstance2?: BarVerticalComponent;
	@ViewChild(AdvancedPieChartComponent) chartInstance3?: AdvancedPieChartComponent;
	@ViewChild(PieChartComponent) chartInstance4?: PieChartComponent;
	@ViewChild(IonContent) content: IonContent;
	@ViewChild(NgxWheelComponent, { static: false }) wheel;
	@ViewChild('maincontainer', { static: false }) maincontainer!: ElementRef;
	@ViewChild('pdfFullscreenContainer') pdfFullscreenContainer!: ElementRef;
	@ViewChild('quillEditorRef') quillEditor: any;
	@ViewChild('zoomContainer', { static: false }) zoomContainer!: ElementRef<HTMLDivElement>;
	@ViewChild('zoomImage') zoomImageRef: ElementRef;		

	startScale = 1;
	currentScale = 1;
	startX = 0;
	startY = 0;
	currentX = 0;
	currentY = 0;
	ongoing = false;


	private isPieChartInitialized = false;
	pieChartOptions: any;
	// private isBarChartInitialized = false;	
	barChartOptions: any;

	isScrom = true;

	quizLeaderBoard = [];

	colorScheme: any = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};

	// quillModules = {
    //     toolbar: [
    //         ['bold', 'italic', 'underline'],
    //         [{ 'header': 1 }, { 'header': 2 }],
    //         [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    //         ['link', 'image'],
    //         ['clean']
    //     ]
    // };

	// quillModules = {
	// 	toolbar: {
	// 		container: [
	// 		['bold', 'italic', 'underline'],
	// 		[{ 'header': 1 }, { 'header': 2 }],
	// 		[{ 'list': 'ordered' }, { 'list': 'bullet' }],
	// 		['link', 'image'],
	// 		['undo', 'redo'], // Custom buttons
	// 		['clean']
	// 		],
	// 		handlers: {
	// 		undo: () => this.undoChange(),
	// 		redo: () => this.redoChange()
	// 		}
	// 	},
	// 	history: {
	// 		delay: 1000,
	// 		maxStack: 100,
	// 		userOnly: true
	// 	}
	// };

	
	quillModules: any = {};
	panzoomInstance: any;
	panzoomInitialized = false;
	zoomResetTimeout: any;
	isZoomed: boolean = false;
	movedToBody: boolean = false;

	ChartOptions: any = {};

	ChartData = [];

	surveyNote: {
		noteType: string;
		QuestionId: number;
		surveyNote: string;
		totalCharLimit: any;
		characterRemain: any;
	};
	maxLengthForSurveyAnswer = 180;
	offlineTaskNote: {
		QuestionId: number;
		offlineTaskNote: string;
	};
	showSurveyNote: boolean = false;

	aboutUsInfo;
	imageHost = ENV.imageHost + ENV.imagePath;
	clientBranding: any;
	MANY_ITEMS = 'MANY_ITEMS';
	subs = new Subscription();
	config = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	isShowTrainerNote = false;
	wbId: any;
	currentWorksheetIndex = null;
	DiwoModuleId = null;
	showNotesInput = false;
	clientId: any;
	clientDetails: any;
	workSheetData: any;
	wordCloudAnsInex = [];
	selectedAnswer = '';
	selectedAnsArr = [];
	userNote;
	isTrainer: boolean = false;
	isAnswerCorrected: boolean;
	isCorrectSequence: boolean;
	isParticalCorrect: boolean;
	editSurveyNoteIndex: any;

	fileType = '.pdf';
	showOfflineNote: boolean = false;
	sessionStatus: any;
	allSessionData: any;
	userId: any;
	pollChartType: any;
	briefAssets = [];
	Wsthumbnail = [];
	pdfFiles = [];
	pdfUrl: SafeResourceUrl | null = null;
	pdfSrc: any;
	checkInterval: any;
	appBrandingInfo: any;
	isShowMarks: boolean = false;
	isQuizPassShowMarks: boolean = false;
	isPdf: boolean = false;
	isPdfLoading: boolean = true;

	trainer_survey: boolean = false;
	isLoading: boolean = false;

	emailError: boolean = false;
	mobileError: boolean = false;

	//Spin The Wheel
	idToLandOn: any;
	screenWidth: number;
	screenHeight: number;
	spinDuration = 8;
	spinCategoryArray: any = [];
	showSpinCategoryQuestion: boolean = false;
	selectCategoryName: any;
	spinResult: any;
	assignUserSpinCategoryArray: any = [];
	noOfTimeUserCanSpinWheel = 0;
	showSpinWheel: boolean = false;
	spinColorArray = ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4'];
	isFullscreen: boolean = false;

	spinAPIcounter = 0;
	maxCharCount: any;
	isMediaWorksheet: any;
	isdesktopView2: boolean = true;
	isTabletLandscapeView: boolean = false;
	vimeoDetails: any;
	uploadPercent: number;
	sessionUserId: any;
	allWorksheetData = [];
	isRead: boolean = false;
	totalWordCloudCharLimit = 15;

	// isDesktop: boolean = window.innerWidth >= 769;
	isdesktopView: boolean = false;
	isMobileView: boolean = false;

	isMobile: boolean = false;
	isTablet: boolean = false;
	isTabletPortraitView: boolean = false;
	isdesktopDetectedView: boolean = false;
	isTabletLandscapeDetectedView: boolean = false;
	isMobileLandscapeView: boolean = false;
	isMobilePortraitView: boolean = false;

	// pdfSrc = 'assets/interactive_pdf_files/M&M Process Excellence Manual Interactive PDF (After Sales).pdf';
	pageNumber: number = 1;
	totalPages: number = 0;
	pdfLoaded: boolean = false;
	pdfReady: boolean = false;

	pdfVisible: boolean = false;
	videoUploadProgress: number = 0;
	isVideoUploading: boolean = false;
	isModalOpen = false;
	isSurveyRatingScaleTextSelected : boolean = false;

	isLandscapePDF: boolean = false;
	iconObject = {
		full_screen_24: null,
		full_screen_exit_icon_24: null,
		info_icon_20: null,
	};

	checkVideoStatusIntervel: any;
	maxReAttemptsAllowed: number = 0;
	isQuizReAttemptPassingSubmitted: boolean = false;

	constructor(
		public http: HttpClient,
		public sanitizer: DomSanitizer,
		public platform: Platform,
		public navCtrl: NavController,
		public alertCtrl: AlertController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public appService: AppService,
		public dragulaService: DragulaService,
		public activatedRoute: ActivatedRoute,
		private location: Location		
	) {
		document.addEventListener('fullscreenchange', () => {
			this.isFullscreen = !!document.fullscreenElement;
		});
		
		if (this.appService.sessionStatusInterval) {
			clearInterval(this.appService.sessionStatusInterval);
		}
		setTimeout(() => {
			this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));
			this.isdesktopView2 = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;

			this.isdesktopDetectedView = this.appService.isdesktopView;
			this.isTabletLandscapeDetectedView = this.appService.isTabletLandscapeView;
			this.isMobile = this.appService.isMobile;
			this.isTablet = this.appService.isTablet;
			this.isTabletPortraitView = this.appService.isTabletPortraitView;
			this.isMobileLandscapeView = this.appService.isMobileLandscapeView;
			this.isMobilePortraitView = this.appService.isMobilePortraitView;
			// console.log('---this.isMobileLandscapeView---', this.isMobileLandscapeView);
			// console.log('--this.isMobilePortraitView--', this.isMobilePortraitView);
		}, 100);

		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);
		this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.userId = JSON.parse(localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')).user.id : null;

		this.activatedRoute.queryParams.subscribe((params) => {
			if (params.worksheetId) {
				this.wbId = JSON.parse(params.worksheetId);
			}

			if (params.index > -1) {
				this.currentWorksheetIndex = JSON.parse(params.index);
			}

			if (params.trainer_survey) {
				this.trainer_survey = true;
			}
			// else{
			// 	this.trainer_survey  = false;
			// }
		});
		if (!this.platform.is('desktop')) {
			this.setWidthAndHeight();
		} else {
			this.screenWidth = 335;
			this.screenHeight = 370;
			this.showSpinWheel = true;
			this.isdesktopView = true;
		}

		this.ChartOptions = {
			showXAxis: true,
			showYAxis: true,
			showLegend: false,
			showGridLines: true,
			showXAxisLabel: false,
			showYAxisLabel: false,
			legendPosition: 'right',
			autoScale: false,
			curve: curveLinear,
			roundDomains: true,
			xAxisLabel: '',
			yAxisLabel: '',
			gradient: false,
			showLabels: true,
			isDoughnut: false,
		};

		this.checkWindowSize();				

	}

	ionViewWillEnter() {
		if (localStorage.getItem('isTrainer') == 'true') {
			this.isTrainer = true;
		}
		this.clientDetails = JSON.parse(localStorage.getItem('user_client')) || null;
		this.maxReAttemptsAllowed = this.clientDetails?.maxReAttemptsAllowed || 0;
		this.clientId = this.clientDetails ? this.clientDetails.id : null;
		this.getWSdetails();
		this.getVimeoCredieal();
		this.getAppBranding();
	}	

	// ngAfterViewInit() {
	// 	this.quillModules = {
	// 		toolbar: {
	// 			container: '#custom-toolbar',
	// 			handlers: {
	// 				undo: () => this.undoChange(),
	// 				redo: () => this.redoChange()
	// 			}
	// 		},
	// 		history: {
	// 			delay: 1000,
	// 			maxStack: 100,
	// 			userOnly: true
	// 		}
	// 	};		
		
	// }

	ngAfterViewInit(): void {
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

		// Initialize zoom behavior for single image
		const img = this.zoomImageRef?.nativeElement;
		const container = this.zoomContainer?.nativeElement;

		if (!img || !container) return;

		img.style.transform = 'scale(1) translate(0,0)';
		img.style.transition = '';

		this.startScale = 1;
		this.currentScale = 1;
		this.startX = 0;
		this.startY = 0;
		this.currentX = 0;
		this.currentY = 0;
		this.ongoing = false;

		img.addEventListener('touchstart', (e: TouchEvent) => {
			if (e.touches.length === 2) {
				this.ongoing = true;
				const [p1, p2] = [e.touches[0], e.touches[1]];
				this.startScale = this.currentScale;
				this.startX = this.currentX;
				this.startY = this.currentY;

				const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
				img.dataset.startDistance = distance.toString();

				const midX = (p1.clientX + p2.clientX) / 2;
				const midY = (p1.clientY + p2.clientY) / 2;
				img.dataset.startMidX = midX.toString();
				img.dataset.startMidY = midY.toString();
			}
		});

		img.addEventListener('touchmove', (e: TouchEvent) => {
			if (e.touches.length === 2 && this.ongoing) {
				const [p1, p2] = [e.touches[0], e.touches[1]];
				const dx = p2.clientX - p1.clientX;
				const dy = p2.clientY - p1.clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const scaleFactor = distance / +img.dataset.startDistance!;
				const adjustedScale = this.startScale + (scaleFactor - 1) * 0.15;

				this.currentScale = Math.max(1, Math.min(adjustedScale, 4));

				if (this.currentScale > 1) e.preventDefault();

				if (this.currentScale > 1 && !img.classList.contains('zoom-overlay')) {
					img.classList.add('zoom-overlay');
					this.isZoomed = true;

					if (!this.movedToBody) {
						document.body.appendChild(img);
						this.movedToBody = true;
					}
				} else if (this.currentScale === 1 && this.movedToBody) {
					img.classList.remove('zoom-overlay');
					container.appendChild(img);
					this.movedToBody = false;
				}

				document.body.style.overflow = this.currentScale > 1 ? 'hidden' : '';

				const midX = (p1.clientX + p2.clientX) / 2;
				const midY = (p1.clientY + p2.clientY) / 2;
				// img.style.transformOrigin = `${midX}px ${midY}px`;

				const rect = img.getBoundingClientRect();
				const offsetX = midX - rect.left;
				const offsetY = midY - rect.top;

				img.style.transformOrigin = `${offsetX}px ${offsetY}px`;

				this.currentX = this.startX + (midX - +img.dataset.startMidX!);
				this.currentY = this.startY + (midY - +img.dataset.startMidY!);

				img.style.transform = `scale(${this.currentScale}) translate(${this.currentX / this.currentScale}px, ${this.currentY / this.currentScale}px)`;
			}
		}, { passive: false });

		img.addEventListener('touchend', (e: TouchEvent) => {
			if (e.touches.length < 2) {
				this.ongoing = false;
				this.resetZoom(img, container);
			}
		});

		// Backup reset for missed touchend
		document.addEventListener('touchend', () => {
			clearTimeout(this.zoomResetTimeout);
			this.zoomResetTimeout = setTimeout(() => {
				this.resetZoom(img, container);
			}, 100);
		});
	}

	onImageLoad(): void {
		const imgEl = this.zoomImageRef?.nativeElement;
		const containerEl = this.zoomContainer?.nativeElement;

		if (!imgEl || !containerEl) return;

		imgEl.style.transform = 'scale(1) translate(0,0)';
		imgEl.style.transition = '';

		this.startScale = 1;
		this.currentScale = 1;
		this.startX = 0;
		this.startY = 0;
		this.currentX = 0;
		this.currentY = 0;
		this.ongoing = false;

		imgEl.addEventListener('touchstart', (e: TouchEvent) => {
			if (e.touches.length === 2) {
				this.ongoing = true;
				const [p1, p2] = [e.touches[0], e.touches[1]];
				this.startScale = this.currentScale;
				this.startX = this.currentX;
				this.startY = this.currentY;

				const distance = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
				imgEl.dataset.startDistance = distance.toString();

				const midX = (p1.clientX + p2.clientX) / 2;
				const midY = (p1.clientY + p2.clientY) / 2;
				imgEl.dataset.startMidX = midX.toString();
				imgEl.dataset.startMidY = midY.toString();
			}
		});

		imgEl.addEventListener('touchmove', (e: TouchEvent) => {
			if (e.touches.length === 2 && this.ongoing) {
				const [p1, p2] = [e.touches[0], e.touches[1]];
				const dx = p2.clientX - p1.clientX;
				const dy = p2.clientY - p1.clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const scaleFactor = distance / +imgEl.dataset.startDistance!;
				const adjustedScale = this.startScale + (scaleFactor - 1) * 0.15;
				this.currentScale = Math.max(1, Math.min(adjustedScale, 4));

				if (this.currentScale > 1) e.preventDefault();

				if (this.currentScale > 1 && !imgEl.classList.contains('zoom-overlay')) {
					imgEl.classList.add('zoom-overlay');
					this.isZoomed = true;

					if (!this.movedToBody) {
						document.body.appendChild(imgEl);
						this.movedToBody = true;
					}
				} else if (this.currentScale === 1 && this.movedToBody) {
					imgEl.classList.remove('zoom-overlay');
					containerEl.appendChild(imgEl);
					this.movedToBody = false;
				}

				document.body.style.overflow = this.currentScale > 1 ? 'hidden' : '';

				const midX = (p1.clientX + p2.clientX) / 2;
				const midY = (p1.clientY + p2.clientY) / 2;
				// imgEl.style.transformOrigin = `${midX}px ${midY}px`;

				const rect = imgEl.getBoundingClientRect();
				const offsetX = midX - rect.left;
				const offsetY = midY - rect.top;

				imgEl.style.transformOrigin = `${offsetX}px ${offsetY}px`;

				this.currentX = this.startX + (midX - +imgEl.dataset.startMidX!);
				this.currentY = this.startY + (midY - +imgEl.dataset.startMidY!);

				imgEl.style.transform = `scale(${this.currentScale}) translate(${this.currentX / this.currentScale}px, ${this.currentY / this.currentScale}px)`;
			}
		}, { passive: false });

		imgEl.addEventListener('touchend', (e: TouchEvent) => {
			if (e.touches.length < 2) {
				this.ongoing = false;
				this.resetZoom(imgEl, containerEl);
			}
		});

		// Fallback for missed touchend
		document.addEventListener('touchend', () => {
			clearTimeout(this.zoomResetTimeout);
			this.zoomResetTimeout = setTimeout(() => {
				this.resetZoom(imgEl, containerEl);
			}, 100);
		});
	}

	resetZoom(img: HTMLImageElement, container: HTMLElement): void {
		this.startScale = 1;
		this.currentScale = 1;
		this.startX = 0;
		this.startY = 0;
		this.currentX = 0;
		this.currentY = 0;
		this.ongoing = false;
		this.isZoomed = false;

		img.style.transition = 'transform 0.3s ease';
		img.style.transform = 'scale(1) translate(0,0)';
		img.classList.remove('zoom-overlay');

		document.body.style.overflow = '';

		if (this.movedToBody) {
			container.appendChild(img);
			this.movedToBody = false;
		}

		setTimeout(() => {
			img.style.transition = '';
		}, 300);

		delete img.dataset.startDistance;
		delete img.dataset.startMidX;
		delete img.dataset.startMidY;
	}

	zoomIn(): void {
		if (this.panzoomInstance) {
		this.panzoomInstance.zoomIn();
		}
	}

	zoomOut(): void {
		if (this.panzoomInstance) {
		this.panzoomInstance.zoomOut();
		}
	}
	
	initPanzoom(): void {
		if (!this.zoomContainer?.nativeElement) return;

		// Dispose existing instance to avoid multiple initializations
		if (this.panzoomInstance) {
			this.panzoomInstance.dispose?.();
		}

		this.panzoomInstance = panzoom(this.zoomContainer.nativeElement, {
			maxZoom: 3,
			minZoom: 1,
			zoomSpeed: 0.065,
			bounds: true,
			boundsPadding: 0.1,
			contain: 'inside', // Important for single image: allows scroll outside zoom
			force: true // Ensures immediate activation
		});

		// Prevent default double-click behavior
		this.zoomContainer.nativeElement.addEventListener('dblclick', (e: Event) => {
			e.preventDefault();
		});
	}

	
	// onImageLoad(): void {
	// 	if (this.panzoomInstance) {
	// 		this.panzoomInstance.dispose?.(); // Prevent multiple initializations
	// 	}

	// 	if (this.zoomContainer?.nativeElement) {
	// 		this.panzoomInstance = panzoom(this.zoomContainer.nativeElement, {
	// 		maxZoom: 3,
	// 		minZoom: 1,
	// 		zoomSpeed: 0.065,
	// 		bounds: true,
	// 		boundsPadding: 0.1,
	// 		});

	// 		console.log('Panzoom initialized after image load:', this.panzoomInstance);

	// 		this.zoomContainer.nativeElement.addEventListener('dblclick', (e: Event) => {
	// 		e.preventDefault();
	// 		});
	// 	}
	// }

	// resetZoom(): void {
	// 	if (this.panzoomInstance) {
	// 	this.panzoomInstance.moveTo(0, 0);
	// 	this.panzoomInstance.zoomAbs(0, 0, 1); // Reset to default zoom level
	// 	}
	// }
	

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getsessionDetailsForGraph() {
		this.appService.getsessionDetailsForGraph(this.wbId).subscribe((res: any) => {
			if (res.success) {
				this.allSessionData = res.data;
				let data = [];
				let currentWorksheetIndex = 0;
				if (this.workSheetData.type == 'Poll') {
					for (let item of this.allSessionData) {
						if (item.UserId == this.userId) {
							for (let worksheet of item.SessionWorksheets) {
								if (worksheet.id == this.wbId) {
									this.pollChartType = worksheet.chart;
									for (let question of worksheet.SessionQuestions) {
										if (question.question == this.workSheetData.SessionQuestions[0].question) {
											for (let option of question.SessionOptions) {
												let payload = { name: option.text, id: option.OptionId, value: 0 };
												data.push(payload);
											}
										}
									}
								}
							}
						}
					}

					for (let item of this.allSessionData) {
						for (let worksheet of item.SessionWorksheets) {
							for (let question of worksheet.SessionQuestions) {
								if (question.question == this.workSheetData.SessionQuestions[0].question) {
									for (let option of question.SessionOptions) {
										if (option.selectedAns) {
											for (let data_ of data) {
												if (option.OptionId == data_.id) {
													data_.value = data_.value + 1;
												}
											}
										}
									}
								}
							}
						}
					}

					this.ChartData = [];
					this.ChartData = data;

					console.log('this.ChartData before PieChartOptions', this.ChartData);

					if (this.pollChartType === 'Pie' && this.ChartData && this.ChartData.length > 0) {
						this.pieChartOptions = this.getPieOptions(this.ChartData);
					}
					

					console.log('this.ChartData after PieChartOptions', this.ChartData);

					// console.log('this.ChartData before barChartOptions', this.ChartData);
					// console.log('this.isPieChartInitialized', this.isPieChartInitialized);

					if (this.pollChartType == 'Bar') {
						this.barChartOptions = JSON.parse(JSON.stringify(this.setBarChartOptions(this.ChartData || [])));
					}

					// console.log('this.barChartOptions after ', this.barChartOptions);
				} else if (
					this.workSheetData.type == 'Quiz' ||
					this.workSheetData.type == 'Quiz (Randomised)' ||
					this.workSheetData.type == 'Spin The Wheel'
				) {
					this.quizLeaderBoard = [];
					for (let item of this.allSessionData) {
						let alreadyExists = false;
						for (let i = 0; i < item.SessionWorksheets.length; i++) {
							// Check manually if user already exists in quizLeaderBoard
							for (let j = 0; j < this.quizLeaderBoard.length; j++) {
								if (this.quizLeaderBoard[j].id === item.User.id) {
									alreadyExists = true;
									break; // Stop checking further
								}
							}

							if (alreadyExists) {
								continue; // Skip adding duplicate
							}

							if (item.SessionWorksheets[i].submit == true) {
								if (item.User && item.User.fullName) {
									let payload = {
										name: item.User.fullName,
										rank: 0,
										score: 0,
										id: item.User.id,
									};
									this.quizLeaderBoard.push(payload);
								}
							}
						}

						for (let i = 0; i < item.SessionWorksheets.length; i++) {
							if (this.wbId == item.SessionWorksheets[i].id) {
								currentWorksheetIndex = i;
							}
						}
					}

					for (let item of this.quizLeaderBoard) {
						for (let session of this.allSessionData) {
							if (item.id == session.User.id) {
								item.score = session.SessionWorksheets[currentWorksheetIndex].score
									? session.SessionWorksheets[currentWorksheetIndex].score
									: 0;
							}
						}
					}
					this.quizLeaderBoard = this.quizLeaderBoard.sort((a, b) => {
						if (a.score > b.score) {
							return -1;
						}
					});

					// Slice to keep only the top 10 users
					this.quizLeaderBoard = this.quizLeaderBoard.slice(0, 10);

					let rank = 0;
					for (let i = 0; i < this.quizLeaderBoard.length; i++) {
						if (i == 0) {
							rank++;
							this.quizLeaderBoard[i].rank = rank;
						} else if (this.quizLeaderBoard[i - 1].score != this.quizLeaderBoard[i].score) {
							rank++;
							this.quizLeaderBoard[i].rank = rank;
						} else {
							this.quizLeaderBoard[i].rank = rank;
						}
					}
				}
			}
		});
	}	

	workSheetTypesArray = [
		'Learning Content',
		'Discussion',
		'Follow Us',
		'Quiz',
		'Quiz (Randomised)',
		'Poll',
		'Survey',
		'Offline Task',
		'Spin The Wheel',
		'Word Cloud',
	];
	

	async findMaxQuesCharCount(AllQuestions) {
		let charCount = 0;
		for (let question of AllQuestions) {
			if (question.spinCatName && question.spinCatName.length > charCount) {
				charCount = question.spinCatName.length;
			}
		}
		return charCount;
	}

	async setWorksheetAllData(data) {
		this.workSheetData = [];
		this.workSheetData = data;

		this.showSurveyNote = false;
		this.isTrainer = false;
		this.isAnswerCorrected = false;
		this.isCorrectSequence = false;
		this.isParticalCorrect = false;
		this.showOfflineNote = false;

		this.isShowMarks = false;
		this.isQuizPassShowMarks = false;
		this.trainer_survey = false;

		this.emailError = false;
		this.mobileError = false;

		this.showSpinCategoryQuestion = false;

		this.isRead = data.isRead;
		this.isLoading = false;

		this.isQuizReAttemptPassingSubmitted = false;

		if (this.workSheetData && this.workSheetData.activityTemplate) {
			const key = this.appService.GetLanguageKey(this.workSheetData.activityTemplate);
			if (key) {
				this.workSheetData.activityTemplate = this.appService.getTranslation(`Utils.Database.${key}`);
			}
		}

		if (this.checkVideoStatusIntervel) {
			clearInterval(this.checkVideoStatusIntervel);
		}

		if (
			this.workSheetData.type == 'Learning Content' &&
			this.workSheetData.SessionAssets &&
			this.workSheetData.SessionAssets.length > 0
		) {
			if (this.workSheetData.SessionAssets[0].type == 'Video' && this.workSheetData.worksheetStatus != 'Completed') {
				this.checkVideoCompleteStatus();
			} else {
				if (this.checkVideoStatusIntervel) {
					clearInterval(this.checkVideoStatusIntervel);
				}
			}
		} else {
			if (this.checkVideoStatusIntervel) {
				clearInterval(this.checkVideoStatusIntervel);
			}
		}

		if (this.workSheetData.description) {
			setTimeout(() => {
				this.displayTextOrHyperLink(this.workSheetData.description);
			}, 100);
		}

		// console.log('workSheetData in setWorksheetAllData ', this.workSheetData);
		this.sessionUserId = this.workSheetData?.SessionUser?.id ? this.workSheetData.SessionUser.id : null;
		this.appService.getSessionWorksheetDetails({ id: this.sessionUserId }).subscribe((res: any) => {
			if (res.success) {
				this.allWorksheetData = res.data;

				if (this.currentWorksheetIndex == null) {
					for (let i = 0; i < this.allWorksheetData.length; i++) {
						if (this.allWorksheetData[i]?.id == this.wbId) {
							this.currentWorksheetIndex = i;
							this.DiwoModuleId = this.allWorksheetData[i].DiwoModuleId;
							break;
						}
					}
				} else {
					this.DiwoModuleId = this.allWorksheetData[this.currentWorksheetIndex].DiwoModuleId;
				}
			}
		});

		setTimeout(() => {
			this.isLoading = true;
		}, 200);

		this.sessionStatus =
			this.workSheetData.SessionUser &&
			this.workSheetData.SessionUser.Session &&
			this.workSheetData.SessionUser.Session.status
				? this.workSheetData.SessionUser.Session.status
				: null;

		//Social Media Worksheet
		this.isMediaWorksheet =
			this.workSheetData.SessionUser &&
			this.workSheetData.SessionUser.Workbook &&
			this.workSheetData.SessionUser.Workbook.isMediaWorksheet
				? this.workSheetData.SessionUser.Workbook.isMediaWorksheet
				: false;

		//check for keepSurveyOn
		if (
			this.workSheetData &&
			this.workSheetData.sessionFeedback &&
			this.workSheetData.keepSurveyOn &&
			this.workSheetData.keepSurveyOnDays &&
			this.sessionStatus == 'Closed'
		) {
			let SessionEndDate_: any = moment(this.workSheetData.SessionUser.Session.SessionEndDate).format(
				'YYYY-MM-DD HH:mm:ss'
			);
			if (this.workSheetData.SessionUser && this.workSheetData.SessionUser.Session) {
				let currentDate: any = moment().format('YYYY-MM-DD HH:mm:ss');
				let fDate = moment(SessionEndDate_).add(this.workSheetData.keepSurveyOnDays, 'days');
				let futureDate: any = moment(fDate).format('YYYY-MM-DD HH:mm:ss');
				if (currentDate <= futureDate) {
					this.sessionStatus = 'Active';
				} else {
					this.sessionStatus = 'Closed';
				}
			}
		}

		if (this.workSheetData && this.workSheetData.SessionAssets && this.workSheetData.SessionAssets.length > 0) {
			this.workSheetData.imgPath = ENV.imageHost + ENV.imagePath + this.workSheetData.SessionAssets[0].path;
		}
		this.briefAssets = [];
		if (this.workSheetData.type == 'Offline Task' || this.workSheetData.type == 'Learning Content') {
			for (let assets of this.workSheetData.SessionAssets) {
				if (assets.forBrief == true) {
					this.briefAssets.push(assets);
				}
			}
		}

		this.Wsthumbnail = [];
		// if (this.workSheetData.type == 'Offline Task' || this.workSheetData.type == 'Learning Content') {
		for (let assets of this.workSheetData.SessionAssets) {
			if (assets.forBrief == false && assets.type == 'Image') {
				this.Wsthumbnail.push(assets);
				this.workSheetData.imgPath = ENV.imageHost + ENV.imagePath + assets.path;
				// console.log('this.workSheetData.imgPath', this.workSheetData.imgPath);
				break;
			} else if (assets.forBrief == false && assets.type == 'Video') {
				this.Wsthumbnail.push(assets);

				break;
			}
		}
		// }

		console.log('this.workSheetData', this.workSheetData);

		this.pdfFiles = [];
		this.pdfUrl = '';

		if (this.workSheetData.type === 'Learning Content' && this.workSheetData.isPdf) {
			this.isPdf = this.workSheetData.isPdf;
		} else {
			this.isPdf = false;
		}

		if (this.workSheetData.type === 'Learning Content' && this.isPdf) {
			for (let asset of this.workSheetData.SessionAssets) {
				if (asset.type === 'Document' && !asset.forBrief) {
					this.pdfFiles.push(asset);
					// this.pdfUrl = this.imageHost + asset.path; // Set the latest file URL
					// console.log('PDF Path:', this.pdfUrl);

					this.appService
						.convertPdfToBase64({
							path: this.imageHost + asset.path,
						})
						.subscribe((res: any) => {
							if (res.success) {
								this.pdfSrc = res.data;
								this.pdfUrl = `data:application/pdf;base64,${res.base64}`;
							}
							this.isPdfLoading = false; // Hide the loader once the PDF is loaded
						});
					(error) => {
						console.error('Error loading PDF:', error);
						this.isPdfLoading = false; // Hide the loader even if there's an error
					};
				}
			}

			if (this.pdfFiles.length > 0) {
				this.pdfVisible = true;
			} else {
				this.pdfVisible = false;
				this.isPdfLoading = false; // Ensure the loader is hidden if no PDFs are found
			}
		} else {
			this.pdfVisible = false;
			this.isPdfLoading = false; // Ensure the loader is hidden for non-PDF types
		}

		this.userNote = this.workSheetData.userNote;

		// console.log('this.pdfVisible', this.pdfVisible);

		//Spin The Wheel
		if (this.workSheetData.type == 'Spin The Wheel') {
			this.spinCategoryArray = [];
			this.assignUserSpinCategoryArray = [];
			let asssignSpinQue = JSON.parse(this.workSheetData.assignSpinQue);

			if (asssignSpinQue && asssignSpinQue.length > 0) {
				this.showSpinCategoryQuestion = true;
				for (let question of asssignSpinQue) {
					this.assignUserSpinCategoryArray.push(question);
				}
			}
		}

		let categoryList = [];
		let totalSpinScore = 0;
		this.workSheetData.spinTheQuestionCount = 0;
		let spinCatCount = 0;

		if (this.workSheetData.type == 'Spin The Wheel' && this.workSheetData?.SessionQuestions?.length > 0) {
			this.maxCharCount = await this.findMaxQuesCharCount(this.workSheetData.SessionQuestions);
		}

		if (this.workSheetData?.SessionQuestions?.length > 0) {
			for (let question of this.workSheetData.SessionQuestions) {

				console.log('question in session questions', question);

				let count = 0;
				let answer;
				let que = question;
				question.answerStatus = '';
				let iscorrect = false;
				let iswrong = false;
				question.submission = null;

				//For Out of Marks
				if (['Quiz', 'Quiz (Randomised)'].indexOf(this.workSheetData.type) != -1) {
					this.workSheetData.spinTheQuestionCount = this.workSheetData.spinTheQuestionCount + question.spinQueScore;
				}

				if (question?.allowFileTypes) {
					let str_name = question.allowFileTypes.toString();
					question.allowFileTypes = this.removeLastComma(str_name);
				}

				if (question.questionType == 'File upload' || this.workSheetData.type == 'Offline Task') {
					let fileType = [];
					let finalData = [];
					if (question.allowFileTypes) {
						fileType = question.allowFileTypes.split(',');
						for (let _type of fileType) {
							if (_type == 'Audio') {
								finalData.push('.mp3');
							} else if (_type == 'Video') {
								finalData.push('.mp4');
							} else if (_type == 'Image') {
								finalData.push('.png');
								finalData.push('.jpg');
							} else if (_type == 'PDF') {
								finalData.push('.pdf');
							}
						}
					}

					question.allowFile = finalData.toString();
				}

				if (question.questionType == 'Drag and Drop' && question.SessionOptions) {
					if (question.SessionOptions[0].userSeq == 0 || question.SessionOptions[0].userSeq == null) {
						let options = question.SessionOptions.sort(() => Math.random() - 0.5);
						question.SessionOptions = [];
						let count = 1;
						for (let op of options) {
							op.userSeq = count;
							count++;
						}
						question.SessionOptions = options;

						// let payload = {
						// 	options: options,
						// };

						this.updateCurrentWorksheetChangesInToTheLocalStorge();

						// this.appService.submitSequency(payload,this.wbId,this.isRead).subscribe((res: any) => {
						// 	if (res.success) {
						// 		for (let question of this.workSheetData.SessionQuestions) {
						// 			if (question.id == res.data[0].SessionQuestionId) {
						// 				question.SessionOptions = res.data;
						// 			}
						// 		}
						// 	}
						// });
					} else {
						let temp = question.SessionOptions.sort((a, b) => {
							if (a.userSeq < b.userSeq) {
								return -1;
							}
						});
						question.SessionOptions = temp;
					}
				}

				////Spin The Wheel
				if (
					this.workSheetData.type == 'Spin The Wheel' &&
					question &&
					(question.questionType == 'MCQ' || question.questionType == 'Drag and Drop') &&
					question.spinCatName
				) {
					let spinCategoryPayload = {
						id: question.spinCatIndex,
						text: question.spinCatName,
						fillStyle: '',
						textDirection: 'reversed',
						textFillStyle: '#FFFFFF',
						spinCatIndex: question.spinCatIndex,
						spinQueScore: 0,
						spinCatName: question.spinCatName,
						textFontSize: 0,
						textOrientation: 'horizontal',
						textAlignment: 'outer',
						textMargin: 13,
					};

					// if (spinCatCount % 2 == 0) {
					// 	spinCategoryPayload.fillStyle = '#FF66C4'; // Even index
					// } else {
					// 	spinCategoryPayload.fillStyle = '#FFFFFF'; // Odd index
					// }

					if (this.maxCharCount == 15) {
						spinCategoryPayload.textFontSize = 12;
					} else if (this.maxCharCount < 15 && this.maxCharCount > 10) {
						spinCategoryPayload.textFontSize = 13;
					} else {
						spinCategoryPayload.textFontSize = 16;
					}

					if (categoryList.indexOf(question.spinCatIndex) == -1) {
						if (this.spinCategoryArray.length < 4) {
							spinCategoryPayload.fillStyle = this.spinColorArray[this.spinCategoryArray.length];
						} else {
							spinCategoryPayload.fillStyle = this.spinColorArray[this.spinCategoryArray.length - 3];
						}

						spinCatCount++;
						// spinCategoryPayload.spinQueScore = spinCategoryPayload.spinQueScore + question.spinQueScore;
						// spinCategoryPayload.text =
						// 	question.spinCatName + '\n' + ' ' + '(' + spinCategoryPayload.spinQueScore + ')';
						this.spinCategoryArray.push(spinCategoryPayload);
						categoryList.push(question.spinCatIndex);
					}

					// else {
					// 	let indexNo = categoryList.indexOf(question.spinCatIndex);
					// 	this.spinCategoryArray[indexNo].spinQueScore =
					// 		this.spinCategoryArray[indexNo].spinQueScore + question.spinQueScore;

					// 	this.spinCategoryArray[indexNo].text =
					// 		question.spinCatName + '\n' + ' ' + '(' + this.spinCategoryArray[indexNo].spinQueScore + ')';
					// }

					if (this.workSheetData.submit) {
						for (let spinqueIndex of this.assignUserSpinCategoryArray) {
							if (spinqueIndex == question.spinCatIndex) {
								totalSpinScore = question.spinQueScore;
								this.workSheetData.spinTheQuestionCount = this.workSheetData.spinTheQuestionCount + totalSpinScore;
							}
						}
					}
				}

				for (let option of que.SessionOptions) {
					if (question.questionType == 'MCQ') {
						if (option.selectedAns == true && option.correctAns == true) {
							iscorrect = true;
						} else if (option.selectedAns == false && option.correctAns == true) {
							iswrong = true;
						} else if (option.selectedAns == true && option.correctAns == false) {
							iswrong = true;
						}
					} else if (question.questionType == 'Drag and Drop') {
						if (option.userSeq == option.sr_no) {
							iscorrect = true;
						} else {
							iswrong = true;
						}
					}
					if (
						this.workSheetData.type == 'Survey' &&
						(this.workSheetData.sessionFeedback || !this.workSheetData.sessionFeedback)
					) {
						if (option.text == null || option.text == '') {
							if (this.workSheetData.sessionFeedBackMinCount == 1) {
								option.text = option.sr_no;
							} else if (this.workSheetData.sessionFeedBackMinCount == 0) {
								option.text = option.sr_no - 1;
							}
						}
					}

					if (this.workSheetData.type == 'Survey' && question.questionType == 'Rating scale') {
						if (option.text == null || option.text == '') {
							option.text = option.sr_no;
						}
					}

					if (option.correctAns == true) {
						count++;
					}

					if (option.selectedAns) {
						answer = option.text.toString();
					}

					if ((this.workSheetData.type == 'Poll' || this.workSheetData.type == 'Survey') && option.selectedAns) {
						question.selectedAnswer = option.text.toString();
					}
				}

				if (que.questionType === 'Rating scale') {
					if (typeof que.userRatingArray === 'string' && que.userRatingArray.trim() !== '') {
						que.ratingArray = que.userRatingArray.split(',');
					} else {
						que.ratingArray = [];
					}
				}
				  
				console.log('que.ratingArray',que.ratingArray);

				if (iscorrect && !iswrong) {
					question.answerStatus = 'Correct';
				} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
					question.answerStatus = 'Partially Correct';
				} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
					question.answerStatus = 'Incorrect';
				} else if (!iscorrect && iswrong) {
					question.answerStatus = 'Incorrect';
				}

				if (count > 1) {
					question.questionType = 'multiCorrectAns';
				} else if (count == 1) {
					question.selectedAnswer = answer;
				}

				if (this.workSheetData.type == 'Survey' && question.multipleOption) {
					question.questionType = 'multiCorrectAns';
				}
			}
		}

		if (
			this.workSheetData.type == 'Poll' ||
			this.workSheetData.type == 'Quiz' ||
			this.workSheetData.type == 'Quiz (Randomised)' ||
			this.workSheetData.type == 'Spin The Wheel'
		) {
			this.getsessionDetailsForGraph();
		}

		//to clear previous selection only for spin the wheel
		if (this.workSheetData.type == 'Spin The Wheel' && !this.workSheetData.submit && this.spinAPIcounter <= 0) {
			this.appService.clearForm(this.wbId).subscribe((res: any) => {
				this.spinAPIcounter++;
				localStorage.removeItem(this.wbId.toString());
				this.getWSdetails();
			});
		}

		if (
			this.workSheetData?.isShowScore &&
			((this.workSheetData?.timeToShowOption == 'Upon Session Closure' &&
				this.workSheetData?.SessionUser?.Session?.status == 'Closed') ||
				(this.workSheetData?.timeToShowOption == 'Upon Submission' && this.workSheetData.submit))
		) {
			this.isShowMarks = true;
		}

		if (this.workSheetData.isQuizCompletion && this.workSheetData.isQuizAttempted && this.sessionStatus == 'Closed') {
			this.isQuizReAttemptPassingSubmitted = true;
		}

		if (
			this.workSheetData?.type == 'Quiz' &&
			this.workSheetData?.isShowScore &&
			((this.workSheetData?.timeToShowOption == 'Upon Session Closure' &&
				this.workSheetData?.SessionUser?.Session?.status == 'Closed') ||
				(this.workSheetData?.timeToShowOption == 'Upon Submission' && this.workSheetData.isQuizCompletion))
		) {
			this.isQuizPassShowMarks = true;
		}

		this.setWordCloudAnswerLimit();
	}

	checkVideoCompleteStatus() {
		this.checkVideoStatusIntervel = setInterval(() => {
			let client_percentage = JSON.parse(localStorage.getItem('user_client'))?.percentage
				? JSON.parse(localStorage.getItem('user_client'))?.percentage
				: 0;

			let percentage = this.appService.videoPlayInPercentage * 100;
			console.log('percentage', percentage);

			if (this.wbId == this.appService.videoLogId) {
				if (percentage >= client_percentage) {
					this.workSheetData.worksheetStatus = 'Completed';
					if (this.checkVideoStatusIntervel) {
						clearInterval(this.checkVideoStatusIntervel);
					}
				}
			}
		}, 1000);
	}

	getWSdetails() {
		if (localStorage.getItem(this.wbId.toString())) {
			this.setWorksheetAllData(JSON.parse(localStorage.getItem(this.wbId.toString())));
		} else {
			this.appService.getUserslWorksheetDetails(this.wbId).subscribe(async (res: any) => {
				if (res.success) {
					let data = res.data;
					if (['Learning Content', 'Discussion'].indexOf(data.type) == -1 && !data.isRead) {
						if (data && data?.SessionQuestions.length > 0) {
							for (let question of data.SessionQuestions) {
								question.latitude = null;
								question.longitude = null;
								question.geoLocation = null;
								question.queGroupIndex = null;
								question.queGroupName = null;
								// question.spinCatIndex = null;
								question.spinCatName = null;
								// question.spinQueScore = 0;
								
								if (question.questionType === 'Rating scale') {
									if (typeof question.userRatingArray === 'string' && question.userRatingArray.trim() !== '') {
									  question.ratingArray = question.userRatingArray.split(',');
									} else {
									  question.ratingArray = [];
									}
								}
								  
								console.log('question.ratingArray',question.ratingArray);
							
								for (let option of question.SessionOptions) {
									option.userSeq = null;
									option.selectedAns = false;
									option.userAnswer = null;
									option.correctAns = option.isCorrectAnswer;
								}
							}
						}
					}
					//Save All Data Into the localStorge
					if (
						(!data.submit && !data.isQuizCompletion) ||
						(data.isQuizCompletion &&
							!data.isQuizAttempted &&
							!data.isReattemptLocked &&
							this.sessionStatus !== 'Closed')
					) {
						localStorage.setItem(this.wbId.toString(), JSON.stringify(data));
					} else {
						localStorage.removeItem(this.wbId.toString());
					}

					// console.log('getUserslWorksheetDetails', data);
					this.setWorksheetAllData(data);
				}
			});
		}
	}

	setWordCloudAnswerLimit() {
		if (this.workSheetData.type == 'Word Cloud') {
			if (this.workSheetData.SessionQuestions.length > 0) {
				for (let que of this.workSheetData.SessionQuestions) {
					for (let op of que.SessionOptions) {
						if (op.userAnswer) {
							op.remainigWordCloudLimit = 15 - op.userAnswer.length;
						} else {
							op.remainigWordCloudLimit = 15;
						}
					}
				}
			}
		}
	}

	// updateRemainigLimit(questionIndex, optionIndex) {
	// 	this.workSheetData.SessionQuestions[questionIndex].SessionOptions[optionIndex].remainigWordCloudLimit =
	// 		15 - this.workSheetData.SessionQuestions[questionIndex].SessionOptions[optionIndex].userAnswer.length;
	// }

	updateRemainigLimit(event: any, questionIndex: number, optionIndex: number) {
		const inputValue = event.target.value || '';
		const trimmedValue = inputValue.substring(0, this.totalWordCloudCharLimit);

		const option = this.workSheetData.SessionQuestions[questionIndex].SessionOptions[optionIndex];
		option.userAnswer = trimmedValue;
		option.remainigWordCloudLimit = this.totalWordCloudCharLimit - trimmedValue.length;
	}

	back() {
		this.appService.pauseVideo(true);

		if (this.showSurveyNote || this.showNotesInput || this.showOfflineNote) {
			this.showSurveyNote = false;
			this.showNotesInput = false;
			this.showOfflineNote = false;
			return; 
		}
		
		if (this.navCtrl && this.location) {
			this.navCtrl.pop().catch(() => {});
			this.location.back();
		}
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

	getAppBrancding() {
		if (localStorage.getItem('appBrandingAboutUsPage') == 'True') {
			localStorage.setItem('appBrandingAboutUsPage', 'false');
			this.clientBranding = JSON.parse(localStorage.getItem('app_branding'));
			this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		}
	}

	checkedOption(i, j, event) {
		for (let option of this.workSheetData.SessionQuestions[i].SessionOptions) {
			if (option.text == event.target.value) {
				option.selectedAns = true;
			} else {
				option.selectedAns = false;
			}
		}

		let payload = {
			userAnswer: this.workSheetData.SessionQuestions[i].SessionOptions,
		};
		if (this.trainer_survey) {
			this.submitQuiz(payload);
		} else {
			//Save in the LocalStorge
			this.updateCurrentWorksheetChangesInToTheLocalStorge();
		}
	}

	multiCheckedOption(i, id) {
		setTimeout(() => {
			for (let option of this.workSheetData.SessionQuestions[i].SessionOptions) {
				if (option.id == id) {
					if (option.selectedAns == true) {
						option.selectedAns = false;
					} else if (option.selectedAns == false) {
						option.selectedAns = true;
					}
				}
			}
			let payload = {
				userAnswer: this.workSheetData.SessionQuestions[i].SessionOptions,
			};
			if (this.trainer_survey) {
				this.submitQuiz(payload);
			} else {
				//Save in the LocalStorge
				this.updateCurrentWorksheetChangesInToTheLocalStorge();
			}
		}, 500);
	}

	async presentToast(text) {
		let toast = this.toastCtrl.create({
			message: text,
			duration: 3000,
			position: 'bottom',
		});
		(await toast).present();
	}

	submitWordCloud(i, j) {
		let payload = {
			userAnswer: this.workSheetData.SessionQuestions[i].SessionOptions,
		};
		if (this.trainer_survey) {
			this.submitQuiz(payload);
		} else {
			//Save in the LocalStorge
			this.updateCurrentWorksheetChangesInToTheLocalStorge();
		}
	}

	submitQuiz(payload) {
		if (this.trainer_survey) {
			this.appService.submitTrainerSurveyUserAnswer(payload).subscribe(
				(res: any) => {
					if (res.success) {
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
		} else {
			this.appService.submitUserAns(payload, this.isRead, this.wbId).subscribe(
				(res: any) => {
					if (res.success) {
						if (res.message2 == 'Session is not live') {
							this.presentToast(res.message);
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
	}

	showTrainerNote() {
		// this.workSheetData[index].isShowTrainerNote = !this.workSheetData[index].isShowTrainerNote;
		this.isShowTrainerNote = !this.isShowTrainerNote;
	}

	addEditLearnerNote() {
		// this.learnerNoteInput.nativeElement.focus();
		this.showNotesInput = true;
	}

	cancel() {
		if (this.workSheetData.description) {
			setTimeout(() => {
				this.displayTextOrHyperLink(this.workSheetData.description);
			}, 100);
		}

		this.showNotesInput = false;
		this.showSurveyNote = false;
		this.showOfflineNote = false;
	}

	saveSurveyNote(survey) {
		this.surveyNote = {
			QuestionId: survey.id,
			noteType: survey.questionType,
			surveyNote: survey.surveyNote,
			totalCharLimit: survey.surveyCharLimit,
			characterRemain: survey.surveyCharLimit - (survey && survey.surveyNote ? survey.surveyNote.length : 0),
		};

		if (this.trainer_survey) {
			let payload = {
				userNote: this.surveyNote,
				trainer_survey: this.trainer_survey,
			};

			this.appService.updateUserSurveyNote(this.wbId, payload, this.isRead).subscribe(
				(res: any) => {
					this.showSurveyNote = false;
					// this.getWSdetails();
				},
				(err) => {
					const key = this.appService.GetLanguageKey(err.error.error);
					if (key) {
						this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
					} else {
						this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
					}
					// this.navCtrl.navigateRoot('tabs/all-modules');
				}
			);
		} else {
			for (let question of this.workSheetData.SessionQuestions) {
				if (question.id == survey.id) {
					question.surveyNote = survey.surveyNote;
					break;
				}
			}
			this.showSurveyNote = false;
			//Update On the LocalStorge
			this.updateCurrentWorksheetChangesInToTheLocalStorge();
		}
	}

	updateCurrentWorksheetChangesInToTheLocalStorge() {
		localStorage.setItem(this.wbId.toString(), JSON.stringify(this.workSheetData));
	}

	saveOfflineTaskNote(item) {
		this.offlineTaskNote = {
			QuestionId: item.id,
			offlineTaskNote: item.offlineTaskNote,
		};

		for (let question of this.workSheetData.SessionQuestions) {
			if (question.id == item.id) {
				question.offlineTaskNote = item.offlineTaskNote;
				break;
			}
		}
		this.showOfflineNote = false;
		this.updateCurrentWorksheetChangesInToTheLocalStorge();
		// let payload = {
		// 	userNote: this.offlineTaskNote,
		// };

		// this.appService.updateUserOfflineTaskNote(this.wbId, payload,this.isRead).subscribe(
		// 	(res: any) => {
		// 		this.showOfflineNote = false;
		// 		// this.getWSdetails();
		// 	},
		// 	(err) => {
		// 		this.presentToast(err.error.error);
		// 		// this.navCtrl.navigateRoot('tabs/all-modules');
		// 	}
		// );
	}

	saveLearnerNote() {
		let payload = {
			userNote: this.userNote,
		};
		if (this.trainer_survey) {
			this.appService.updateTrainerSurveyUserNote(this.wbId, payload).subscribe(
				(res: any) => {
					this.showNotesInput = false;
					localStorage.removeItem(this.wbId.toString());
					this.getWSdetails();
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
		} else {
			this.workSheetData.userNote = this.userNote;
			this.showNotesInput = false;
			// if(!this.workSheetData.submit){
			this.updateCurrentWorksheetChangesInToTheLocalStorge();
			// }else{
			this.appService.updateUserNote(this.wbId, payload).subscribe(
				(res: any) => {
					// localStorage.removeItem(this.wbId.toString());
					// this.getWSdetails();
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
			// }
		}
	}

	clearForm() {
		// let questionIds = [];
		// for (let question of this.workSheetData.SessionQuestions) {
		// 	questionIds.push(question.id);
		// }
		// let payload = {
		// 	questionIds: questionIds,
		// };
		this.appService.clearForm(this.wbId).subscribe((res: any) => {
			localStorage.removeItem(this.wbId.toString());
			this.getWSdetails();
		});
	}

	changeFlag(type) {
		if (type == 'Fav') {
			this.workSheetData.isFav = !this.workSheetData.isFav;
		} else if (type == 'Bookmark') {
			this.workSheetData.isBookmark = !this.workSheetData.isBookmark;
		} else if (type == 'Imp') {
			this.workSheetData.isImp = !this.workSheetData.isImp;
		} else if (type == 'Group Activty') {
			this.workSheetData.isGroupActivty = !this.workSheetData.isGroupActivty;
		}
		let payload = {
			isFav: this.workSheetData.isFav,
			isImp: this.workSheetData.isImp,
			isGroupActivty: this.workSheetData.isGroupActivty,
			isBookmark: this.workSheetData.isBookmark,
			trainer_survey: this.trainer_survey,
		};
		this.updateCurrentWorksheetChangesInToTheLocalStorge();
		this.appService.updateUserDiwoFlag(this.workSheetData.id, payload).subscribe(
			(res: any) => {},
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

	submitForm() {
		// this.appService.submitForm(this.workSheetData.id).subscribe((res: any) => {
		//   this.back();
		// })

		let updateQuestionList = [];
		let updateOptionIds = [];
		let assignUserSpinCategoryArray = [];

		let updateOption = [];
		let updateSelectedOption = [];
		let updateQuestion = [];
		let clearOptions = [];
		let userNote = this.workSheetData.userNote;

		let flag = true;
		let totalMarkes = 0;

		let ClientId = this.clientId;

		if (this.assignUserSpinCategoryArray && this.assignUserSpinCategoryArray.length > 0) {
			assignUserSpinCategoryArray = this.assignUserSpinCategoryArray;
		}

		// console.log('--assignUserSpinCategoryArray0-', assignUserSpinCategoryArray);

		for (let question of this.workSheetData.SessionQuestions) {
			//For Validation
			let flag_ = false;
			let flag_1 = false;
			if (
				this.workSheetData.type == 'Poll' ||
				this.workSheetData.type == 'Word Cloud' ||
				(this.workSheetData.type == 'Survey' &&
					(question.questionType === 'Drop Down' || question.questionType === 'Rating scale')) ||
				((this.workSheetData.type == 'Quiz' ||
					this.workSheetData.type == 'Quiz (Randomised)' ||
					(this.workSheetData.type == 'Spin The Wheel' && question.spinCatName == this.selectCategoryName)) &&
					question.questionType != 'Drag and Drop')
			) {
				for (let option of question.SessionOptions) {
					if (this.workSheetData.type != 'Word Cloud') {
						if (option.selectedAns) {
							flag_ = true;
						}
					}

					if (this.workSheetData.type == 'Survey' && question.questionType === 'Rating scale' && question.SurveyRatingType != 'Text') {						
						flag_ = true;						
					}

					if (this.workSheetData.type == 'Word Cloud') {
						if (option.userAnswer == null || option.userAnswer == undefined || option.userAnswer == '') {
							flag_1 = true;
						}
					}
				}

				if (!flag_ && this.workSheetData.type != 'Word Cloud') {
					flag = false;
					this.presentToast(this.appService.getTranslation('Utils.selectyouranswer'));
					break;
				}

				if (flag_1) {
					flag = false;
					this.presentToast(this.appService.getTranslation('Utils.selectsurveyAnswer'));
					break;
				}
			}

			if (this.workSheetData.type == 'Survey') {
				if (
					['Short answer', 'Long answer', 'Email', 'Mobile No', 'Date', 'Date Time'].indexOf(question.questionType) >
						-1 &&
					(question.surveyNote == null || question.surveyNote == undefined || question.surveyNote == '')
				) {
					flag = false;
					this.presentToast(this.appService.getTranslation('Utils.selectsurveyAnswer'));
					break;
				} else if (
					question.questionType == 'Geo Tag' &&
					(question.geoLocation == null || question.geoLocation == undefined || question.geoLocation == '')
				) {
					this.presentToast(this.appService.getTranslation('Utils.selectsurveyAnswer'));
					flag = false;
				} else if (question.questionType == 'File upload' && question.SessionQuestionSubmissions.length == 0) {
					this.presentToast(this.appService.getTranslation('Utils.selectSurveyassets'));
					flag = false;
				}

				if (question.questionType == 'Mobile No' && this.mobileError) {
					return;
				}

				if (question.questionType == 'Email' && this.emailError) {
					return;
				}
			}

			if (this.workSheetData.type == 'Offline Task') {
				if (
					question.isFileSubmission &&
					question.SessionQuestionSubmissions.length == 0 &&
					question.isTextResponse &&
					(question.offlineTaskNote == '' || question.offlineTaskNote == null)
				) {
					this.presentToast(this.appService.getTranslation('Utils.selectbriefassetsAndText'));
					flag = false;
				} else if (question.isFileSubmission && question.SessionQuestionSubmissions.length == 0) {
					this.presentToast(this.appService.getTranslation('Utils.selectbriefassets'));
					flag = false;
				} else if (question.isTextResponse && (question.offlineTaskNote == '' || question.offlineTaskNote == null)) {
					this.presentToast(this.appService.getTranslation('Utils.briefTextResponse'));
					flag = false;
				}
			}

			if (flag) {
				let outOffMark = question.spinQueScore;
				if (outOffMark <= 0) {
					outOffMark = 1;
				}
				if (['Quiz', 'Quiz (Randomised)'].indexOf(this.workSheetData.type) != -1) {
					if (question.questionType == 'Drag and Drop') {
						let correctSequency = true;

						if (question?.SessionOptions?.length > 0) {
							for (let option of question.SessionOptions) {
								if (option.sr_no != option.userSeq) {
									correctSequency = false;
								}
								updateOption.push({ id: option.id, userSeq: option.userSeq });
							}
							if (correctSequency) {
								totalMarkes = totalMarkes + outOffMark;
							}
						}
					} else if (['MCQ', 'multiCorrectAns'].indexOf(question.questionType) != -1) {
						let correct = false;
						let incorrect = false;
						if (question?.SessionOptions?.length > 0) {
							for (let option of question.SessionOptions) {
								if (option.correctAns != option.selectedAns) {
									incorrect = true;
								} else if (option.selectedAns) {
									correct = true;
								}
								if (option.selectedAns) {
									updateSelectedOption.push({ id: option.id, selectedAns: option.selectedAns });
								}
							}

							if (incorrect && correct && question.questionType == 'multiCorrectAns') {
								totalMarkes = totalMarkes + outOffMark / 2;
							} else if (correct) {
								totalMarkes = totalMarkes + outOffMark;
							}
						}
					}
				} else if (this.workSheetData.type == 'Survey') {
					if (
						['Short answer', 'Long answer', 'Date', 'Date Time', 'Mobile No', 'Email'].indexOf(question.questionType) !=
						-1
					) {
						updateQuestion.push({ id: question.id, surveyNote: question.surveyNote });
					} else if (['Geo Tag'].indexOf(question.questionType) != -1) {
						updateQuestion.push({
							id: question.id,
							latitude: question.latitude,
							longitude: question.longitude,
							geoLocation: question.geoLocation,
						});
					} else if (['MCQ', 'Rating scale', 'Drop Down'].indexOf(question.questionType) != -1) {

						console.log('question data in rating scale without text selected', question);

						if (question?.SessionOptions?.length > 0) {
							for (let option of question.SessionOptions) {
								if (option.selectedAns) {
									updateSelectedOption.push({ id: option.id, selectedAns: option.selectedAns });
								}
							}
						}

						if(question.questionType == 'Rating scale' && question.surveyUserRating > 0 && question.ratingArray && question.ratingArray.length > 0){							
							updateQuestion.push({
								id: question.id, 
								SurveyRatingType: question.SurveyRatingType,
								ratingMaxLabel: question.ratingMaxLabel,
								ratingMinLabel: question.ratingMinLabel,
								userRatingArray: question.userRatingArray.toString(),
								surveyUserRating: question.surveyUserRating,
								surveyMinScale: question.surveyMinScale,
								surveyMaxScale: question.surveyMaxScale								 
							});							
						}					
						
					} else if (['multiCorrectAns'].indexOf(question.questionType) != -1) {
						if (question?.SessionOptions?.length > 0) {
							for (let option of question.SessionOptions) {
								if (option.selectedAns) {
									updateSelectedOption.push({ id: option.id, selectedAns: option.selectedAns });
								} else {
									clearOptions.push({ id: option.id, selectedAns: option.selectedAns });
								}
							}
						}
					}
				} else if (this.workSheetData.type == 'Offline Task') {
					if (question.isTextResponse) {
						updateQuestion.push({ id: question.id, offlineTaskNote: question.offlineTaskNote });
					}
				} else if (this.workSheetData.type == 'Word Cloud') {
					if (question?.SessionOptions?.length > 0) {
						for (let option of question.SessionOptions) {
							if (option.userAnswer) {
								updateOption.push({ id: option.id, userAnswer: option.userAnswer });
							}
						}
					}
				} else if (this.workSheetData.type == 'Poll') {
					if (question?.SessionOptions?.length > 0) {
						for (let option of question.SessionOptions) {
							if (option.selectedAns) {
								updateSelectedOption.push({ id: option.id, selectedAns: option.selectedAns });
							}
						}
					}
				} else if (this.workSheetData.type == 'Spin The Wheel') {
					// spinCatIndex
					if (assignUserSpinCategoryArray.indexOf(question.spinCatIndex) != -1) {
						if (question.questionType == 'Drag and Drop') {
							let correctSequency = true;
							if (question?.SessionOptions?.length > 0) {
								for (let option of question.SessionOptions) {
									if (option.sr_no != option.userSeq) {
										correctSequency = false;
									}
									updateOption.push({ id: option.id, userSeq: option.userSeq });
								}
								if (correctSequency) {
									totalMarkes = totalMarkes + outOffMark;
								}
							}
						} else if (['MCQ', 'multiCorrectAns'].indexOf(question.questionType) != -1) {
							let correct = false;
							let incorrect = false;
							if (question?.SessionOptions?.length > 0) {
								for (let option of question.SessionOptions) {
									if (option.correctAns != option.selectedAns) {
										incorrect = true;
									} else if (option.selectedAns) {
										correct = true;
									}
									if (option.selectedAns) {
										updateSelectedOption.push({ id: option.id, selectedAns: option.selectedAns });
									} else {
										clearOptions.push({ id: option.id, selectedAns: option.selectedAns });
									}
								}

								if (incorrect && correct && question.questionType == 'multiCorrectAns') {
									totalMarkes = totalMarkes + outOffMark / 2;
								} else if (correct) {
									totalMarkes = totalMarkes + outOffMark;
								}
							}
						}
					}
				}
			}
		}

		//console.log('-------totalMarkes--------', totalMarkes);
		//console.log('-------updateOption--------', updateOption);
		//console.log('-------updateSelectedOption--------', updateSelectedOption);
		//console.log('-------updateQuestion--------', updateQuestion);

		if (flag) {
			// let payload = {
			// 	updateOptionIds,
			// 	updateQuestionList,
			// 	assignUserSpinCategoryArray,
			// 	userNote
			// };
			let payload = {
				userNote,
				updateOption,
				updateSelectedOption,
				updateQuestion,
				totalMarkes,
				assignUserSpinCategoryArray,
				clearOptions,
				ClientId,
			};

			console.log('payload in submit form', payload);		

			if (this.trainer_survey) {
				this.appService.submitTrainerSurveyForm(this.workSheetData.id).subscribe((res: any) => {
					// this.back();
					localStorage.removeItem(this.wbId.toString());
					this.presentToast(this.appService.getTranslation('Utils.submitanswer'));
					this.content.scrollToTop(1000);
					this.getWSdetails();
				});
			} else {
				this.appService
					.submitForm(payload, this.workSheetData.id, this.sessionUserId, this.isRead)
					.subscribe((res: any) => {
						// this.back();
						localStorage.removeItem(this.wbId.toString());
						this.presentToast(this.appService.getTranslation('Utils.submitanswer'));
						this.content.scrollToTop(1000);
						this.getWSdetails();
						if (res.message2 == 'Session is not live') {
							this.presentToast(res.message);
						}
					});

				this.saveSpinTheWheelAssignQuestion();
			}
		}
	}

	saveSpinTheWheelAssignQuestion() {
		if (this.workSheetData.type == 'Spin The Wheel' && this.assignUserSpinCategoryArray.length > 0) {
			this.appService
				.saveDiwoSpinTheWheelAssignQuestion(this.assignUserSpinCategoryArray, this.workSheetData.id)
				.subscribe((res: any) => {
					localStorage.removeItem(this.wbId.toString());
					this.presentToast(this.appService.getTranslation('Utils.submitanswer'));
					this.content.scrollToTop(1000);
					this.getWSdetails();
					if (res.message2 == 'Session is not live') {
						this.presentToast(res.message);
					}
				});
		}
	}

	addEditSurveyNote(survey, index) {
		if (!this.workSheetData.submit) {
			this.editSurveyNoteIndex = index;
			this.surveyNote = {
				QuestionId: survey.id,
				noteType: survey.questionType,
				surveyNote: survey.surveyNote,
				totalCharLimit: survey.surveyCharLimit,
				characterRemain: survey.surveyCharLimit - (survey && survey.surveyNote ? survey.surveyNote.length : 0),
			};

			this.showSurveyNote = true;
		}
	}

	checkcharacterlimit(data) {
		this.surveyNote.characterRemain = data.totalCharLimit - data.surveyNote.length;
	}

	addEditOfflineTaskNote(survey, index) {
		if (!this.workSheetData.submit) {
			this.editSurveyNoteIndex = index;
			this.offlineTaskNote = {
				QuestionId: survey.id,
				offlineTaskNote: survey.offlineTaskNote,
			};

			this.showOfflineNote = true;
		}
	}

	async showLoading(message?: string) {
		this.isLoading = true;
		if (message) {
			const loading = await this.loadingCtrl.create({
				message: message,
				//   duration: 3000,
			});
			loading.present();
			return;
		} else {
			const loading = await this.loadingCtrl.create({
				//message: 'Please wait...',
				//   duration: 3000,
			});
			loading.present();
			return;
		}
	}

	closeModal() {
		this.isModalOpen = false;
		this.isVideoUploading = false;
	}

	async dismiss() {
		setTimeout(async () => {
			// this.isLoading = false;
			return await this.loadingCtrl.dismiss();
		}, 100);
		return;
	}

	getVimeoCredieal() {
		this.appService.getVimeoCredintialByUsingClientId(this.clientId).subscribe((res: any) => {
			if (res.success) {
				this.vimeoDetails = res.data;
			}
		});
	}

	async selectFile(event, question, index) {
		let allowFileTypes = question.allowFileTypes;
		let uploadOnVimeo = question.uploadOnVimeo;
		let limit = question.numberOfFiles - question.SessionQuestionSubmissions.length;

		if (event.target.files && event.target.files.length > 0) {
			let flag = true;
			for (let i = 0; i < event.target.files.length; i++) {
				if (i >= limit) {
					// this.getWSdetails();
				} else {
					let fileType = 'Video';
					let type = 'Video';

					if (
						event.target &&
						event.target.files &&
						event.target.files.length > 0 &&
						event.target.files[i].type.includes('image')
					) {
						fileType = 'Image';
						type = 'Image';
					} else if (
						event.target &&
						event.target.files &&
						event.target.files.length > 0 &&
						event.target.files[i].type.includes('application')
					) {
						fileType = 'Document';
						type = 'PDF';
					} else if (
						event.target &&
						event.target.files &&
						event.target.files.length > 0 &&
						event.target.files[i].type.includes('audio')
					) {
						fileType = 'Audio';
						type = 'Audio';
					}

					if (fileType == 'Image' && event.target.files[i].size >= 5242880) {
						this.presentToast(this.appService.getTranslation('Utils.maximage5mb'));
					} else if (
						fileType == 'Video' &&
						event.target.files[i].size >= 104857600 &&
						this.workSheetData.type != 'Offline Task'
					) {
						this.presentToast(this.appService.getTranslation('Utils.maxVideo100mb'));
					} else if (fileType == 'Document' && event.target.files[i].size >= 10485760) {
						this.presentToast(this.appService.getTranslation('Utils.maxpdf10mb'));
					} else {
						if (allowFileTypes.includes(type)) {
							//for only Offline  Task and Survey Task
							if (this.workSheetData.type == 'Offline Task' || this.workSheetData.type == 'Survey') {
								const parts = event.target.files[i].name.split('.');
								const extension = parts[parts.length - 1];
								const userId = 1000000 + this.userId;
								let fors3FileName = `${userId}_${this.clientId}_QNo_${index + 1}_${
									i + 1
								}_${this.appService.generateRandomString(20)}_${Date.now()}.${extension}`;
								// if (flag) {
								// 	await this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2'));
								// 	flag = false;
								// }
								let asset = {
									title: event.target.files[0].name,
									description: '',
									type: 'Video',
									otherDetails: event.target.files[i],
									data: null,
									vimeoPath: null,
									vmoVideoId: null,
									size: null,
									cmsVideoId: null,
								};
								if (type === 'Video' && uploadOnVimeo) {
									if (this.appService?.configurable_feature?.vimeo) {
										// Upload On The Vimeo
										if (this.vimeoDetails == false) {
											this.presentToast(this.appService.getTranslation('Utils.vimeoTokenNotFound'));
											return;
										}

										const options = {
											token: this.vimeoDetails.vToken,
											url: 'https://api.vimeo.com/me/videos',
											videoName: asset.title,
											videoDescription: asset.description,
										};
										if (flag) {
											await this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2'));
											flag = false;
										}
										this.appService
											.createVimeo(options, asset.otherDetails.size)
											.pipe(
												map((data) => (asset.data = data)),
												switchMap(() => {
													this.appService.updateVimeoLink(asset.data.link);
													if (asset.data.upload.size === asset.otherDetails.size) {
														return this.appService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
													}
												})
											)
											.subscribe(
												(event) => {
													if (event.type === HttpEventType.UploadProgress) {
														this.uploadPercent = Math.round((100 * event.loaded) / event.total);
													} else if (event instanceof HttpResponse) {
														let vmoVideoId = this.getVimeoUserIdFromUrl(asset.data.uri);
														asset.vimeoPath = asset.data.player_embed_url;
														asset.vmoVideoId = vmoVideoId;
														asset.size = asset.size;
														const uploadData = new FormData();
														for (var key in asset) {
															if (key == 'otherDetails') {
																if (asset.type != 'Video') {
																	uploadData.append(asset.type, asset[key]);
																}
															} else {
																if (key != 'Preview') {
																	uploadData.append(key, asset[key]);
																}
															}
														}

														const options = {
															token: this.vimeoDetails.vToken,
															url: 'https://api.vimeo.com/videos',
															presetId: this.vimeoDetails.presetId,
															videoId: asset.vmoVideoId,
														};
														this.appService.applyEmbedPreset(options).subscribe((res: any) => {});

														setTimeout(() => {
															let payload = {
																vimeoPath: asset.vimeoPath,
																vmoVideoId: asset.vmoVideoId,
																size: asset.size,
																type: 'Video',
																title: asset.title,
																DiwoVimeoCredentialId: this.vimeoDetails.id,
															};
															this.appService
																.uploadLearnerSubmissiond(
																	payload,
																	question.id,
																	this.workSheetData.id,
																	null,
																	this.sessionUserId,
																	this.isRead
																)
																.subscribe((res: any) => {
																	if (res.success) {
																		this.dismiss();
																		this.workSheetData.SessionQuestions[index].SessionQuestionSubmissions.push(
																			res.data
																		);
																	}
																});
														}, 200);
													}
												},
												(error) => {
													console.log('Upload Error:', error);
													this.dismiss();
												},
												() => {
													console.log('Upload done');
													this.dismiss();
												}
											);
									} else if (this.appService?.configurable_feature?.mediaCMS) {
										const uploadData_ = new FormData();
										for (var key in asset) {
											if (key == 'otherDetails') {
												uploadData_.append(asset.type, asset[key]);
											} else {
												if (key != 'Preview') {
													uploadData_.append(key, asset[key]);
												}
											}
										}

										if (flag == true) {
											await this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2'));
											flag = false;
										}

										// this.isVideoUploading = true;
										this.isModalOpen = true;

										// this.appService.uploadVideoOnMediaCMS(uploadData_, this.clientId).subscribe((res: any) => {
										this.appService.uploadVideoOnMediaCMS(uploadData_, this.clientId).subscribe({
											next: (event: HttpEvent<any>) => {
												if (event.type === HttpEventType.UploadProgress && event.total) {
													const percentDone = Math.round((event.loaded / event.total) * 100);
													this.videoUploadProgress = percentDone;

													// if (this.videoUploadProgress === 100 && flag) {
													// 	flag = false;
													// 	setTimeout(async () => {
													// 		this.closeModal(); // Hide modal
													// 		await this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2')); // Show loader
													// 	}, 250); // short delay to allow modal transition
													// }

													// if (flag) {
													// 	this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2'));
													// 	flag = false;
													// }
												}

												if (event.type === HttpEventType.Response) {
													const res = event.body;
													if (res.success) {
														this.isVideoUploading = false;
														asset.cmsVideoId = res.data.videoId;
														asset.size = res.data.size;

														setTimeout(() => {
															let payload = {
																// vimeoPath: asset.vimeoPath,
																cmsVideoId: asset.cmsVideoId,
																size: asset.size,
																type: 'Video',
																title: asset.title,
																DiwoVimeoCredentialId: this.vimeoDetails.id,
															};
															this.appService
																.uploadLearnerSubmissiond(
																	payload,
																	question.id,
																	this.workSheetData.id,
																	null,
																	this.sessionUserId,
																	this.isRead
																)
																.subscribe((res: any) => {
																	if (res.success) {
																		this.dismiss();
																		this.workSheetData.SessionQuestions[index].SessionQuestionSubmissions.push(
																			res.data
																		);
																	} else {
																		this.dismiss();
																	}
																});
														}, 200);

														this.dismiss();
													} else {
														this.dismiss();
													}
												} 
												// else {
												// 	// this.dismiss();
												// }
											},
											error: (err) => {
												console.error('Upload failed:', err);
												this.presentToast(err.error.error || 'Upload failed');
												this.dismiss();
											},
										});
									}
								} else {
									if (this.appService?.configurable_feature?.aws_s3) {
										console.log('--------On AWS S3---------');
										if (flag) {
											this.showLoading();
											flag = false;
										}
										this.appService.getPresignedUrl(fors3FileName, fileType).subscribe((res: any) => {
											this.appService
												.uploadFileToS3(res.presignedUrl, event.target.files[i])
												.subscribe(async (res: any) => {
													this.appService
														.uploadLearnerSubmissiond(
															null,
															question.id,
															this.workSheetData.id,
															fors3FileName,
															this.sessionUserId,
															this.isRead
														)
														.subscribe((res: any) => {
															if (res.success) {
																this.dismiss();
																// setTimeout(() => {
																// 	this.isLoading = true;
																// }, 100);

																this.workSheetData.SessionQuestions[index].SessionQuestionSubmissions.push(res.data);
																this.updateCurrentWorksheetChangesInToTheLocalStorge();
															}
														});
												});
										});
										return;
									} else {
										//Upload on the our Server
										console.log('--------On Ore Server---------');
										let uploadData;
										uploadData = new FormData();
										uploadData.append(fileType, event.target.files[i]);
										if (flag) {
											this.showLoading();
											flag = false;
										}
										setTimeout(() => {
											this.appService
												.uploadLearnerSubmissiond(
													uploadData,
													question.id,
													this.workSheetData.id,
													null,
													this.sessionUserId,
													this.isRead
												)
												.subscribe((res: any) => {
													if (res.success) {
														this.dismiss();
														this.workSheetData.SessionQuestions[index].SessionQuestionSubmissions.push(res.data);
														this.updateCurrentWorksheetChangesInToTheLocalStorge();
													}
												});
										}, 200);
									}
								}
							} else {
								let uploadData;
								uploadData = new FormData();
								uploadData.append(fileType, event.target.files[i]);
								if (flag) {
									this.showLoading();
									flag = false;
								}
								setTimeout(() => {
									this.appService
										.uploadLearnerSubmissiond(
											uploadData,
											question.id,
											this.workSheetData.id,
											null,
											this.sessionUserId,
											this.isRead
										)
										.subscribe((res: any) => {
											if (res.success) {
												this.dismiss();
												this.workSheetData.SessionQuestions[index].SessionQuestionSubmissions.push(res.data);
												this.updateCurrentWorksheetChangesInToTheLocalStorge();
											}
										});
								}, 200);
							}
						} else {
							this.presentToast(this.appService.getTranslation('Utils.uploadSelectedFile'));
						}
					}
				}
			}

			// this.workSheetData.SessionQuestions[index].submission = null;
		}
	}

	getVimeoUserIdFromUrl(url) {
		const parts = url.split('/');
		return parts.at(-1);
	}

	deleteSubmisitFile(file, index, questionIndex) {
		this.appService.deleteSubmitedFile(file.id).subscribe((res: any) => {
			if (res.success) {
				//Message Delete Sucessfully
				this.workSheetData.SessionQuestions[questionIndex].SessionQuestionSubmissions.splice(index, 1);
				this.updateCurrentWorksheetChangesInToTheLocalStorge();
			}
		});
	}

	downloadAssetFile(assetDetails) {
		this.appService
			.downloadAssetByAssetId(assetDetails)
			.toPromise()
			.then(
				(res: any) => {
					let link = document.createElement('a');
					link.href = window.URL.createObjectURL(res);
					link.download = `${assetDetails.fileName}`;
					link.click();
				},
				(failed) => {
					console.log('Rejected', failed);
				}
			)
			.catch((err) => {
				console.log('Caught error', err);
			});
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	async doRefresh(e) {
		// this.postId = 1;
		await this.appService.pauseVideo(true);
		setTimeout(() => {
			localStorage.removeItem(this.wbId.toString());
			this.workSheetData = [];
			this.getWSdetails();
			e.target.complete();
		}, 500);
	}

	ionViewDidLeave() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}

		if (this.checkVideoStatusIntervel) {
			clearInterval(this.checkVideoStatusIntervel);
		}
	}

	setWidthAndHeight() {
		let checkIntervel = setInterval(() => {
			if (this.maincontainer && this.maincontainer.nativeElement && this.maincontainer.nativeElement.offsetWidth != 0) {
				let percentage = 0.1 * this.maincontainer.nativeElement.offsetWidth;
				this.screenWidth = this.maincontainer.nativeElement.offsetWidth + percentage;
				this.screenHeight = this.maincontainer.nativeElement.offsetWidth;
				// this.screenHeight = this.screenWidth * (9 / 16);
				this.showSpinWheel = true;
				this.isdesktopView = false;
				clearInterval(checkIntervel);
			}
		}, 10);
	}

	drop($event: CdkDragDrop<string[]>, data) {
		moveItemInArray(data, $event.previousIndex, $event.currentIndex);
		let payload = {
			options: $event.container.data,
		};
		setTimeout(() => {
			let userSequency = 1;
			for (let option of data) {
				option.userSeq = userSequency;
				userSequency++;
			}

			this.updateCurrentWorksheetChangesInToTheLocalStorge();
			// this.appService.submitSequency(payload,this.wbId,this.isRead).subscribe(
			// 	(res: any) => {},
			// 	(err) => {
			// 		this.navCtrl.navigateRoot('tabs/all-modules');
			// 	}
			// );
		}, 200);
	}

	onSelectOption(i, event) {
		for (let option of this.workSheetData.SessionQuestions[i].SessionOptions) {
			if (option.text == event.target.value) {
				option.selectedAns = true;
			} else {
				option.selectedAns = false;
			}
		}
		this.updateCurrentWorksheetChangesInToTheLocalStorge();
	}

	checkEmail(email_: any) {
		let email;
		email = email_.target.value;
		email = email.replace(' ', '');
		let array = [
			'[',
			']',
			'{',
			'}',
			'#',
			'$',
			'%',
			'^',
			'&',
			'*',
			'(',
			')',
			'!',
			'`',
			'~',
			'/',
			',',
			'|',
			'<',
			'>',
			'?',
			'+',
			';',
			':',
			'"',
			"'",
		];
		if (
			email.indexOf('@') >= 1 &&
			email.lastIndexOf('.') > email.indexOf('@') + 1 &&
			email.length >= email.lastIndexOf('.') + 3 &&
			email.indexOf('@') == email.lastIndexOf('@')
		) {
			let invalide = false;
			for (let char of array) {
				if (email.indexOf(char) != -1) {
					invalide = true;
				}
			}
			if (!invalide) {
				this.emailError = false;
				this.updateCurrentWorksheetChangesInToTheLocalStorge();
			} else {
				this.emailError = true;
			}
		} else {
			this.emailError = true;
		}
	}

	checkPhoneNum($event) {
		const phone_ = $event.target.value;
		const countryCode: any = 'IN';
		const phoneDetails = phone(phone_, countryCode);
		if (!phoneDetails.isValid) {
			this.mobileError = true;
		} else {
			this.updateCurrentWorksheetChangesInToTheLocalStorge();
			this.mobileError = false;
		}
	}

	onSpinStart() {}

	onSpinStop() {
		this.showSpinCategoryQuestion = true;
		this.assignUserSpinCategoryArray.push(this.spinResult.spinCatIndex);
		this.noOfTimeUserCanSpinWheel = this.noOfTimeUserCanSpinWheel + 1;
	}

	onClickSpinStart() {
		this.onSpinReset();
		setTimeout(() => {
			this.wheel.spin();
		}, 200);
	}

	onSpinReset() {
		this.showSpinCategoryQuestion = false;
		setTimeout(() => {
			this.wheel.reset();
		}, 200);
		this.spinResult = this.spinCategoryArray[Math.floor(Math.random() * this.spinCategoryArray.length)];
		this.selectCategoryName = this.spinResult.spinCatName;
		this.idToLandOn = this.spinResult.id;
	}

	onClickSpinAgain() {
		let flag = true;
		for (let question of this.workSheetData.SessionQuestions) {
			let flag_ = false;
			if (
				this.workSheetData.type == 'Spin The Wheel' &&
				question.spinCatName == this.selectCategoryName &&
				question.questionType != 'Drag and Drop'
			) {
				for (let option of question.SessionOptions) {
					if (option.selectedAns) {
						flag_ = true;
					}
				}
				if (!flag_) {
					flag = false;
					this.presentToast(this.appService.getTranslation('Utils.selectyouranswer'));
					break;
				}
			}
		}

		if (flag) {
			if (this.assignUserSpinCategoryArray.length > 0) {
				let flags_ = true;
				for (let cat_ of this.spinCategoryArray) {
					let index = this.assignUserSpinCategoryArray.indexOf(cat_.id);
					if (index > -1) {
						let newArray = this.spinCategoryArray.filter((item) => item.id !== cat_.id);
						this.spinCategoryArray = [];
						// this.spinCategoryArray = newArray;

						let spinCatCount = 0;
						for (let item of newArray) {
							let payload = {
								id: item.id,
								text: item.text,
								fillStyle: '',
								textDirection: item.textDirection,
								textFillStyle: item.textFillStyle,
								textFontWeight: item.textFontWeight,
								spinCatIndex: item.spinCatIndex,
								spinQueScore: item.spinQueScore,
								spinCatName: item.spinCatName,
								textFontSize: item.textFontSize,
								textOrientation: item.textOrientation,
								textAlignment: item.textAlignment,
								textMargin: item.textMargin,
							};

							// if (spinCatCount % 2 == 0) {
							// 	payload.fillStyle = '#FF66C4'; // Even index
							// } else {
							// 	payload.fillStyle = '#FFFFFF'; // Odd index
							// }

							if (this.spinCategoryArray.length < 4) {
								payload.fillStyle = this.spinColorArray[this.spinCategoryArray.length];
							} else {
								payload.fillStyle = this.spinColorArray[this.spinCategoryArray.length - 3];
							}

							spinCatCount++;
							this.spinCategoryArray.push(payload);
						}

						flags_ == true;
					}
				}

				if (flags_) {
					// this.onClickSpinStart();
					setTimeout(() => {
						this.showSpinCategoryQuestion = false;
					}, 100);
				}
			}
		}
	}

	getUserLocation(question) {
		if (!this.workSheetData.submit) {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						this.getGeocodedLocation(position.coords.latitude, position.coords.longitude, question);
						question.latitude = position.coords.latitude;
						question.longitude = position.coords.longitude;
						this.updateCurrentWorksheetChangesInToTheLocalStorge();
					},
					(error) => {
						console.log('----error---', error);
						const key = this.appService.GetLanguageKey(error.message);
						if (key) {
							this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
						} else {
							this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
						}
					}
				);
			} else {
				this.presentToast(this.appService.getTranslation('Utils.geolocation_not_supported'));
			}
		}
	}

	getGeocodedLocation(latitude: number, longitude: number, question) {
		this.appService.getLocationName(latitude, longitude).subscribe(
			(response: any) => {
				if (response && response.display_name) {
					question.geoLocation = response.display_name;
					this.updateCurrentWorksheetChangesInToTheLocalStorge();
				} else {
					this.presentToast(this.appService.getTranslation('Utils.locnotfound'));
				}
			},
			(error) => {
				const key = this.appService.GetLanguageKey(error.error.error);
				if (key) {
					this.presentToast(this.appService.getTranslation(`Utils.API.${key}`));
				} else {
					this.presentToast(this.appService.getTranslation('Utils.API.somthing_went_wrong'));
				}
			}
		);
	}

	visitSocialMediaProfile(link) {
		if (link) {
			window.open(`${link}`, '_system', 'location=yes');
		}
	}

	prevItem() {
		if (this.currentWorksheetIndex > 0) {
			this.currentWorksheetIndex--;
			this.wbId = this.allWorksheetData[this.currentWorksheetIndex].id;
			this.getWSdetails();
		}
	}

	nextItem() {
		if (this.currentWorksheetIndex < this.allWorksheetData.length - 1) {
			this.currentWorksheetIndex++;
			this.wbId = this.allWorksheetData[this.currentWorksheetIndex].id;
			this.getWSdetails();
		}
	}

	displayTextOrHyperLink(input) {
		const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
		const contentDiv = document.getElementById('module_description1');
		let htmlContent = '';
		let linkIdCounter = 0;
		htmlContent = input.replace(urlPattern, (url) => {
			linkIdCounter++;
			return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}" style="cursor: pointer;">${url}</a>`;
		});

		if (contentDiv) {
			contentDiv.innerHTML = htmlContent;
		}
		for (let i = 1; i <= linkIdCounter; i++) {
			const linkElement = document.getElementById(`dynamic-hyper-link-${i}`);
			if (!linkElement) {
				continue;
			}
			linkElement.addEventListener('click', (event) => {
				event.preventDefault();
				const url = linkElement.getAttribute('href');
				window.open(url, '_blank');
			});
		}

		return;
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: any) {
		this.checkWindowSize();
	}

	checkWindowSize() {
		if (this.pdfVisible) {
			let flag = true;
			if (this.isFullscreen) {
				this.isFullscreen = false;
				flag = false;
			}

			setTimeout(() => {
				if (!flag) {
					this.isFullscreen = true;
				}
			}, 500);
		}

		this.isdesktopView = window.innerWidth >= 1024; // Desktop: 1024px and above
		this.isTabletLandscapeView = window.innerWidth >= 768 && window.innerWidth < 1024; // Tablet: 768px - 1023px
		this.isMobileView = window.innerWidth < 767; // Mobile: 767px and below

		this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		this.isTabletPortraitView = this.appService.isTabletPortraitView;

		this.isMobileLandscapeView = this.appService.isMobileLandscapeView;
		this.isMobilePortraitView = this.appService.isMobilePortraitView;

		// console.log('----------$$ this.isdesktopView $$---', this.isdesktopView);
		// console.log('----------$$ isTabletLandscapeView $$----', this.isTabletLandscapeView);
		// console.log('----$$ this.isMobile $$--', this.isMobile);
		// console.log('----$$ this.isTablet $$--', this.isTablet);
		// console.log('---$$ this.isTabletPortraitView $$--', this.isTabletPortraitView);
		// console.log('---$$ this.isMobileLandscapeView $$---', this.isMobileLandscapeView);
		// console.log('--$$ this.isMobilePortraitView $$--', this.isMobilePortraitView);
	}

	afterLoadComplete(pdf: any) {
		this.totalPages = pdf.numPages;
		this.pdfLoaded = true;
		this.isPdfLoading = false;

		pdf.getPage(1).then((firstPage: any) => {
			const viewport = firstPage.getViewport({ scale: 1 });
			this.isLandscapePDF = viewport.width > viewport.height;

			// console.log('viewport.width', viewport.width);
			// console.log('viewport.height', viewport.height);
			// console.log('this.isLandscapePDF', this.isLandscapePDF);

			// Reset to page 1 on load
			this.pageNumber = 1;
			this.pdfReady = true;
		});
	}

	nextPage() {
		if (this.pdfLoaded && this.pageNumber < this.totalPages) {
			this.pageNumber++;
		}
	}

	prevPage() {
		if (this.pdfLoaded && this.pageNumber > 1) {
			this.pageNumber--;
		}
	}

	toggleFullscreen() {
		const elem = document.documentElement;

		if (!this.isFullscreen) {
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if ((elem as any).webkitRequestFullscreen) {
				(elem as any).webkitRequestFullscreen();
			} else if ((elem as any).msRequestFullscreen) {
				(elem as any).msRequestFullscreen();
			}
			this.isFullscreen = true;
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if ((document as any).webkitExitFullscreen) {
				(document as any).webkitExitFullscreen();
			} else if ((document as any).msExitFullscreen) {
				(document as any).msExitFullscreen();
			}
			this.isFullscreen = false;
		}

		// Delay to ensure proper screen dimensions
		setTimeout(() => this.updateViewFlags(), 300);
	}

	updateViewFlags() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Reset all flags
		this.isdesktopView = false;
		this.isTablet = false;
		this.isTabletLandscapeView = false;
		this.isTabletPortraitView = false;
		this.isMobile = false;
		this.isMobileLandscapeView = false;
		this.isMobilePortraitView = false;

		// Set flags based on platform and orientation
		this.isdesktopView = this.platform.is('desktop');
		this.isTablet = this.platform.is('tablet');
		this.isMobile = this.platform.is('mobile');

		this.isTabletLandscapeView = this.isTablet && width > height;
		this.isTabletPortraitView = this.isTablet && width <= height;

		this.isMobileLandscapeView = this.isMobile && width > height;
		this.isMobilePortraitView = this.isMobile && width <= height;
	}

	onPdfProgress(progressData: any) {
		if (progressData.loaded === progressData.total) {
			this.isPdfLoading = false; // Hide the spinner when loading is complete
		}
	}


	isDisabled(): boolean {
		return this.sessionStatus === 'Closed' || this.workSheetData?.submit;
	}	  	  

	setUserRating(i, value: number) {
		// this.workSheetData.SessionQuestions[i].isSurveyQueNotSelected = false;
		// if (!this.isSubmited) {

		console.log('value', value);
			// this.isSurveyRatingScaleTextSelected = true;
			this.workSheetData.SessionQuestions[i].surveyUserRating = value;

			// this.updateDripLocalData();
		// }
	}

	isRatingFilled(i, j: number): boolean {
		return j < this.workSheetData.SessionQuestions[i].surveyUserRating;
	}			
	
	  getPieOptions(data: any[]): any {		
		const maxLabelLength = 29;
		const chartCenter = this.isMobile ? ['50%', '40%'] : ['50%', '45%'];
		const chartRadius = this.isMobile ? '55%' : '65%';

		const filteredData = data.filter((item) => item.value > 0);

		let showSelectedOption: string[] = [];

		// Define your custom colors
		const customColors = ['#215968', '#01bfbd', '#ff66c4', '#5271ff'];

		// Apply custom colors to first few items, fallback to default for rest
		const coloredData = filteredData.map((item, index) => {
			if (item.value > 0) {
				showSelectedOption.push(item.name);
			}

			return {
				...item,
				itemStyle: index < customColors.length ? { color: customColors[index] } : {},
			};
		});

		return {
			// title:{
			// text: 'Poll Results',
			// 	left: 'center'
			// },
			tooltip: {
				trigger: 'item',
				extraCssText: 'width:15.625rem; white-space:pre-wrap;',
				formatter: function (params: any) {
					const fullName = params.name;
					const value = params.value;
					const percent = params.percent;
					return `<b>${fullName}</b><br/>Votes: ${value} (${percent}%)`;
				},
			},
			legend: {
				orient: 'horizontal',
				left: 'center',
				bottom: '0',
				selected: showSelectedOption, // control which slices are shown
				itemWidth: 14,
				itemHeight: 14,
				textStyle: {
					width: 160,
					overflow: 'truncate',
					rich: {
						truncated: {
							width: 160,
							overflow: 'truncate',
							fontSize: 12,
							lineHeight: 14,
						},
					},
				},
				formatter: function (name: string) {
					const truncatedName = name.length > maxLabelLength ? name.slice(0, maxLabelLength) + '…' : name;
					return `{truncated|${truncatedName}}`;
				},
			},
			series: [
				{
					name: 'Votes',
					type: 'pie',
					radius: chartRadius,
					center: chartCenter,
					data: coloredData,
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)',
						},
					},
				},
			],
		};
	}

	setBarChartOptions(data: any[]): any {
		const customColors = ['#215968', '#01bfbd', '#ff66c4', '#5271ff'];
		const maxLabelLength = 29;

		const coloredData = data.map((item, index) => {
			const color = customColors[index] || undefined;
			return {
				name: item.name,
				value: item.value,
				itemStyle: color ? { color } : {},
			};
		});

		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
				},
				extraCssText: 'width:15.625rem; white-space:pre-wrap;',
				formatter: function (params: any) {
					const label = params[0].name; // Full label
					const value = params[0].value;
					return `<b>${label}</b><br/>Votes: ${value}`;
				},
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: 50,
				containLabel: true,
			},
			xAxis: {
				type: 'category',
				data: data.map((item) => item.name),
				extraCssText: 'width:200px; white-space:pre-wrap;',
				axisLabel: {
					interval: 0,
					rotate: 0,
					width: 100,
					overflow: 'truncate',
					formatter: function (value: string) {
						const displayText = value.length > maxLabelLength ? value.slice(0, maxLabelLength) + '…' : value;
						return `{tooltipStyle|${displayText}}`;
					},
					rich: {
						tooltipStyle: {
							width: 100,
							overflow: 'truncate',
							lineHeight: 18,
							align: 'center',
						},
					},
				},
				axisTick: {
					alignWithLabel: true,
				},
			},
			yAxis: {
				type: 'value',
			},
			series: [
				{
					name: 'Votes',
					type: 'bar',
					barWidth: '60%',
					data: coloredData,
				},
			],
		};
	}

	attendGuide() {
		console.log('------attendGuide----------');
		this.workSheetData.attendGuide = true;
		this.appService.updateAtentGuideFlag({ SessionWorkSheetId: this.workSheetData.id }).subscribe((res: any) => {});
		this.updateCurrentWorksheetChangesInToTheLocalStorge();
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
