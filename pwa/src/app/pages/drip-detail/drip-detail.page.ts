import {
	Component,
	ElementRef,
	OnInit,
	Renderer2,
	ViewChild,
	NgZone,
	OnDestroy,
	ChangeDetectorRef,
	HostListener,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { IonContent, NavController, ToastController, Platform, IonSlides } from '@ionic/angular';
import { AppService } from 'src/app/app.service';
import { ENV } from 'src/environments/environment';
import { DragulaService } from 'ng2-dragula';
import { Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { curveLinear, curveNatural } from 'd3-shape';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import phone from 'phone';
import { NgxWheelComponent } from 'ngx-wheel';
import Recorder from 'recorder-js';

@Component({
	selector: 'app-drip-detail',
	templateUrl: './drip-detail.page.html',
	styleUrls: ['./drip-detail.page.scss'],
	viewProviders: [DragulaService],
})
export class DripDetailPage implements OnInit, OnDestroy {
	@ViewChild('learnerFileSubmission') learnerFileSubmission: ElementRef;
	@ViewChild(IonContent) content: IonContent;
	@ViewChild('slides', { static: false }) slides: IonSlides;
	// @ViewChild('audioPlayer') audioPlayerRef: ElementRef<HTMLAudioElement>;
	@ViewChild('audioPlayer', { static: false }) audioPlayerRef: ElementRef;

	@ViewChild(NgxWheelComponent, { static: false }) wheel;
	@ViewChild('maincontainer', { static: false }) maincontainer!: ElementRef;
	showCookiePolicyPopUp = false;
	editOfflientTaskNote = false;
	showSurveyNote: boolean = false;
	showAudioRecording: boolean = false;
	userId;
	vimeoDetails;
	safeUrl;
	commentForm: FormGroup;
	post: any;
	config = {
		spaceBetween: 6,
		slidesPerView: 1,
		centeredSlides: true,
	};
	isLiked = false;
	isBookmarked = false;
	incomingPostId: any;
	imageHost = ENV.imageHost + ENV.imagePath;

	MANY_ITEMS = 'MANY_ITEMS';

	subs = new Subscription();

	showSingalPost = false;
	userDetails: any;
	id: any;
	learnerNote: any;
	templateType;
	allQuesions;
	isSubmited: boolean = false;
	isDripClickAction = false;
	isDripClickActionForDrag = false;
	score: any;
	pagerValue: any;
	showCorrectAns: boolean = false;
	selectedMediaAssetDetails: any = [];
	public uploadPercent;
	briefFiles = [];
	otherDetails = {
		UserId: null,
		CampaignId: null,
		DripCampIndex: null,
		PostId: null,
	};
	editlearnerNoteQuestionIndex;
	editSurveyNoteIndex;
	editlearnerNoteQuestionId: any;
	uploadLearnerFile: any;
	isLoading: boolean = false;
	drip_code: any;
	checkInterval: any;
	checkIntervalForVideoAsset: any;
	surveyNote: {
		noteType: string;
		QuestionId: number;
		surveyNote: string;
		totalCharLimit: any;
		characterRemain: any;
	};
	appBrandingInfo: any;
	quizResultType: any;
	showQuizAnswer: boolean = false;

	colorScheme: any = {
		domain: ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'],
	};

	ChartOptions: any = {};

	ChartData = [];

	pollResultType: any;
	allQuestion: any[];
	selectedDripAllData: any;
	selectedDripDetails = {};
	allQuesOptions: any[] = [];
	dripDetails = null;
	showBackButton: boolean = true;

	emailError: boolean = false;
	mobileError: boolean = false;
	data: string;
	assignPostId: any;
	consumed: any;
	clientId: any;
	hyperlinkArray: any[];
	isApiLoad: boolean = false;
	safeHtml: SafeHtml;
	htmlPageClickCount = 0;

	// Mp3 Recorder Code
	isRecording: boolean = false;
	isProcessing: boolean = false;
	transcript: string = '';
	mediaRecorder: MediaRecorder;
	audioChunks: Blob[] = [];
	recognition: any;
	questionIndexForAudioRecording: any;
	isPlaying: boolean = false;
	currentPlyingAudio;
	mediaStream: MediaStream;

	timer: any; // Holds the setInterval reference
	elapsedSeconds: number = 0; // Total elapsed time in seconds
	formattedTime: string = '00:00'; // Display time in "MM:SS" format
	showNoSpeechDetected: boolean = false;

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
	spinAPIcounter = 0;
	maxSpinCharCount: any;
	isdesktopView: boolean = false;
	isTabletLandscapeView: boolean = false;
	isdesktopViewForSpin: boolean = false;
	spinTheQuestionCount = 0;
	noOfTimeSpin: any;
	maxOptVal: number;

	private recorder: Recorder;
	private audioContext: AudioContext;
	// public isRecording: boolean = false;
	public audioBlob: Blob;
	public audioUrl: string;
	isListening: boolean = false;
	// public showAudioRecording: boolean = false;
	// public elapsedSeconds: number = 0;
	// public formattedTime: string = '00:00';
	// private timer: any;

	fileName: string | null = null;
	isSurveyModalOpen: boolean = false;
	//PHone NUmber
	countryList = [];
	// selectedCountry = 'India';
	filterCountryData: any[];
	ipAddress: any;
	selectedCountryCode: any;
	selectedCallingCode: any;
	selectedCountryName = null;

	userRating: number = 0; // Default rating value
	userRatingArray: any[] = []; // Array of stars for visual representation
	maxNo = 8;

	iconObject = {
		heart_preview_not_selected: null,
		thumb_preview: null,
		start_preview: null,
		heart_preview_selected: null,
	};

	constructor(
		private fb: FormBuilder,
		public sanitizer: DomSanitizer,
		private router: Router,
		private route: ActivatedRoute,
		public appService: AppService,
		public dragulaService: DragulaService,
		public navCtrl: NavController,
		public toastCtrl: ToastController,
		public platform: Platform,
		private loadingCtrl: LoadingController,
		private renderer: Renderer2,
		private elRef: ElementRef,
		private zone: NgZone,
		private cdr: ChangeDetectorRef,
		public http: HttpClient
	) {
		setTimeout(async () => {
			await this.appService.setSiteBranding();
		}, 100);

		this.getAppBranding();
		this.platform.backButton.subscribeWithPriority(10, () => {
			if (this.showSingalPost) {
			}
			this.appService.pauseVideo();
		});
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

		if (!this.platform.is('desktop')) {
			this.setWidthAndHeight();
		} else {
			this.screenWidth = 335;
			this.screenHeight = 370;
			this.showSpinWheel = true;
			this.isdesktopViewForSpin = true;
		}
	}

	ngOnInit() {
		this.data = `<h1>Hello</h1><p>This is editable text. <span style="color:#d93f0b;">You can focus it and start typing</span>.</p><p><code>code block</code></p><blockquote><p><strong>Lorem Ipsum</strong>&nbsp;is <span style="background-color:#fbca04;">simply dummy</span> text of the printing and typesetting industry. <em>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s</em>, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></blockquote>`;

		this.appBrandingInfo = JSON.parse(localStorage.getItem('app_branding'));

		if (JSON.parse(localStorage.getItem('user'))) {
			this.userDetails = JSON.parse(localStorage.getItem('user')).user;
			this.userId = this.userDetails.id;
		}
		this.commentForm = this.fb.group({
			comment: [null],
		});

		setTimeout(() => {
			this.isdesktopView = this.appService.isdesktopView;
			this.isTabletLandscapeView = this.appService.isTabletLandscapeView;
		}, 100);

		if (!this.incomingPostId) {
			this.route.queryParams.subscribe((params: any) => {
				if (params && params.dripId) {
					this.incomingPostId = params.dripId;
				}
				if (params && params.drip_code) {
					this.drip_code = params.drip_code;
				}
				if (params && params.showSingalPost) {
					this.showSingalPost = params.showSingalPost;
					if (this.drip_code) {
						localStorage.removeItem('singleDripWithLogin');
						localStorage.removeItem('singleDripWithLoginDripCode');
						this.getPostByDripCode(this.drip_code);
					} else if (this.incomingPostId) {
						if (this.incomingPostId.indexOf('-') > -1) {
							this.incomingPostId = parseInt(this.incomingPostId.split('-')[1]);
						}
						localStorage.removeItem('singleDripWithLogin');
						localStorage.removeItem('singleDripWithLoginDripCode');

						if (this.userDetails) {
							//For Click Link when user is login
							this.getDripDataByUserIdAndDripId();
						} else {
							//For Clink Link when user is not login
							this.getDripData();
						}
					}
				} else {
					if (params && params.id) {
						this.id = params.id;
						this.getPostByUserId();
					}
				}
				// if (params.cookieAcceptance == true || params.cookieAcceptance == 'true') {
				// 	this.showCookiePolicyPopUp = true;
				// }
			});
		}
		if (!this.userDetails) {
		} else {
		}

		// //Get Vimeo Token
		// if (this.userDetails && this.userDetails.client && this.userDetails.client[0] && this.userDetails.client[0].id) {
		// 	this.appService.getVimeoCredintialByUsingCampaignId(this.userDetails.client[0].id).subscribe((res: any) => {
		// 		if (res.success) {
		// 			this.vimeoDetails = res.data;
		// 		}
		// 	});
		// }
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/////////////////////////////// Voice Recording Code //////////////////////////////////////
	initializeSpeechRecognition() {
		// const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
		// this.recognition = new SpeechRecognition();
		// this.recognition.interimResults = true;
		// this.recognition.continuous = true;

		// this.recognition.onresult = (event: any) => {
		// 	const transcripts = Array.from(event.results)
		// 		.map((result: any) => result[0].transcript)
		// 		.join('');
		// 	this.zone.run(() => {
		// 		this.transcript = transcripts;
		// 	});
		// };

		// this.recognition.onend = () => {
		// 	this.transcript = '';
		// };

		// this.recognition.onerror = (event: any) => {
		// 	console.log(event.error);
		// 	this.isRecording = false;
		// };

		// new Code
		// console.log('--------------------initializeSpeechRecognition 1-------------------');
		this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		this.recorder = new Recorder(this.audioContext);
		return;
		// this.cdr.detectChanges();

		// const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		// if (SpeechRecognition) {
		// 	this.recognition = new SpeechRecognition();
		// 	this.recognition.continuous = true;
		// 	this.recognition.interimResults = false;
		// 	this.recognition.lang = 'en-US';

		// 	this.recognition.onresult = (event: any) => {
		// 		const transcript = event.results[event.resultIndex][0].transcript.trim();
		// 		this.transcript += transcript + ' ';
		// 		console.log('this.transcriptthis.transcript', this.transcript);
		// 		this.cdr.detectChanges();
		// 	};

		// 	this.recognition.onerror = (event: any) => {
		// 		console.error('Speech recognition error', event);
		// 	};

		// 	this.recognition.onend = () => {
		// 		this.isListening = false;
		// 		this.cdr.detectChanges();
		// 	};
		// } else {
		// 	console.warn('Speech Recognition API not supported in this browser.');
		// }
	}

	ngOnDestroy() {
		this.stopRecording();
		this.stopSpeechRecognition();
	}

	async startRecording() {
		// this.isRecording = true;
		// this.recognition.start();
		// this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		// this.mediaRecorder = new MediaRecorder(this.mediaStream);
		// this.audioChunks = [];

		// this.mediaRecorder.ondataavailable = (event: any) => {
		// 	this.audioChunks.push(event.data);
		// };

		// this.mediaRecorder.start();

		// New Code
		// console.log('--------------------startRecording-------------------');
		await this.initializeSpeechRecognition();
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({ audio: true })
				.then((stream) => {
					this.recorder.init(stream);
					this.recorder.start();
					this.isRecording = true;
					this.showAudioRecording = true;
					this.startListening();
					this.startTimer();
					this.cdr.detectChanges();
				})
				.catch((error) => {
					console.error('Error accessing media devices.', error);
				});
		} else {
			console.warn('MediaRecorder API not supported in this browser.');
		}
	}

	// New code
	startTimer() {
		this.elapsedSeconds = 0;
		this.formattedTime = '00:00';
		if (this.timer) {
			clearInterval(this.timer);
		}
		this.timer = setInterval(() => {
			this.elapsedSeconds++;
			this.formattedTime = this.formatTime(this.elapsedSeconds);
			this.cdr.detectChanges();
		}, 1000);
	}
	// New Code
	stopTimer() {
		clearInterval(this.timer);
		this.elapsedSeconds = 0;
		this.formattedTime = '00:00';
	}

	// New Code
	formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
	}

	stopRecording() {
		// if (this.showNoSpeechDetected) {
		// 	this.showNoSpeechDetected = false;
		// 	this.startRecording();
		// 	this.isRecording = true;

		// 	this.elapsedSeconds = 0; // Reset timer
		// 	this.updateFormattedTime(); // Ensure it's reset to 00:00
		// 	clearInterval(this.timer); // Clear the timer
		// 	// Start the timer (increment every 1 second)
		// 	this.timer = setInterval(() => {
		// 		this.elapsedSeconds++;
		// 		this.updateFormattedTime();
		// 	}, 1000);
		// 	this.cdr.detectChanges();
		// 	return;
		// }

		// this.isRecording = false;
		// if (this.recognition) {
		// 	this.recognition.stop();
		// }
		// if (this.mediaRecorder) {
		// 	this.mediaRecorder.stop();
		// 	this.mediaRecorder.onstop = async () => {
		// 		const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
		// 		const audioUrl = URL.createObjectURL(audioBlob);
		// 		console.log(audioUrl);

		// 		// Convert the Blob to File and upload to server
		// 		const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
		// 		if (this.showAudioRecording) {
		// 			if (this.transcript != '' && this.transcript != null) {
		// 				this.submitVoiceRecording(file, this.transcript);
		// 			} else {
		// 				console.log('---------------No Speech Detected----------');
		// 				this.showNoSpeechDetected = true;
		// 				clearInterval(this.timer);
		// 				this.cdr.detectChanges();
		// 			}
		// 		}
		// 		if (this.mediaStream) {
		// 			this.mediaStream.getTracks().forEach((track) => track.stop());
		// 		}
		// 	};
		// }

		// New Code
		// console.log('--------------------stopRecording 1-------------------');

		if (this.showNoSpeechDetected) {
			this.showNoSpeechDetected = false;
			this.startRecording();
			this.isRecording = true;

			this.elapsedSeconds = 0; // Reset timer
			this.updateFormattedTime(); // Ensure it's reset to 00:00
			clearInterval(this.timer); // Clear the timer
			// Start the timer (increment every 1 second)
			this.timer = setInterval(() => {
				this.elapsedSeconds++;
				this.updateFormattedTime();
			}, 1000);
			this.cdr.detectChanges();
			return;
		}
		// console.log('--------------------stopRecording 2-------------------');
		if (this.recorder && this.isRecording) {
			this.cdr.detectChanges();
			setTimeout(() => {
				this.recorder
					.stop()
					.then(({ blob }) => {
						this.audioBlob = blob;
						this.audioUrl = URL.createObjectURL(blob);
						this.isRecording = false;
						// this.showAudioRecording = false;
						this.stopTimer();
						this.cdr.detectChanges();

						// console.log('--------------------this.audioBlob', this.audioBlob);
						this.stopSpeechRecognition(); // Stop speech recognition
						this.showLoading(this.appService.getTranslation('Utils.convertingIntoText'));
						setTimeout(() => {
							// const audioBlob = new Blob([this.audioBlob], { type: 'audio/wav' });
							const audioUrl = URL.createObjectURL(this.audioBlob);
							console.log(audioUrl);
							const file = new File([this.audioBlob], 'audio.wav', { type: 'audio/wav' });
							if (this.showAudioRecording) {
								// if (this.transcript != '' && this.transcript != null) {
								// 	this.submitVoiceRecording(file, this.transcript);
								// } else {
								// 	console.log('---------------No Speech Detected----------');
								// 	this.showNoSpeechDetected = true;
								// 	this.dismiss();
								// }
								this.submitVoiceRecording(file);
							}
							if (this.mediaStream) {
								this.mediaStream.getTracks().forEach((track) => track.stop());
							}
						}, 1000);
					})
					.catch((error) => {
						console.error('Error stopping recording.', error);
					});
			}, 1000);
		}
		if (this.recognition) {
			this.recognition.stop();
		}
		if (this.recorder) {
			this.recorder.stop();
		}
	}

	startListening() {
		if (this.recognition) {
			this.transcript = '';
			this.isListening = true;
			this.recognition.start();
			this.cdr.detectChanges();
		}
	}

	//   stopListening() {
	// 	if (this.recognition) {
	// 	  this.isListening = false;
	// 	  this.recognition.stop();
	// 	  this.cdr.detectChanges();
	// 	}
	//   }

	startSpeechRecognition() {
		try {
			this.recognition.start();
		} catch (err) {
			console.error('Speech Recognition Start Error:', err);
		}
	}

	async stopSpeechRecognition() {
		if (this.recognition) {
			this.recognition.stop();
			// console.log('--------transcript', this.transcript);

			this.isListening = false;
			this.cdr.detectChanges();
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

	async dismiss() {
		setTimeout(async () => {
			this.isLoading = false;
			return await this.loadingCtrl.dismiss();
		}, 100);
		return;
	}

	getVimeoToken(campaignId) {
		this.appService.getVimeoCredintialByUsingCampaignId(campaignId).subscribe((res: any) => {
			if (res.success) {
				this.vimeoDetails = res.data;
			}
		});
	}

	ionViewDidLeave() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}
	}

	async getDripData() {
		await this.showLoading();
		this.appService.getDripData(this.incomingPostId).subscribe(
			async (data: any) => {
				try {
					if (data.success) {
						let dripData = await this.formatData(data.data);
						let res = {
							data: dripData,
						};
						if (res.data && res.data.Post && res.data.Post.requiredLogging && !localStorage.getItem('user')) {
							this.dismiss();
							localStorage.setItem('singleDripWithLogin', this.incomingPostId);
							this.navCtrl.navigateForward(['/login']);
						} else {
							if (res.data.Post) {
								this.consumed = res.data.consumed;

								this.id = res.data.id;
								this.removeDripLocalOldData();
								this.isDripClickAction = res.data.isDripClickAction;
								this.isDripClickActionForDrag = res.data.isDripClickAction;
								this.templateType = res.data.Post.tempType;
								if (this.templateType == 'Custom Template') {
									this.navCtrl.navigateForward(['/custom-template'], {
										state: { data: res.data },
									});
								}
								this.showBackButton = res.data.Post.showBackButton;
								this.otherDetails.CampaignId = res.data.CampaignId;
								this.otherDetails.PostId = res.data.PostId;
								this.otherDetails.UserId = res.data.UserId;
								this.otherDetails.DripCampIndex = res.data.DripCampIndex;
								this.appBrandingInfo = res.data.System_branding;
								this.isApiLoad = true;
								//spin the wheel
								this.noOfTimeSpin = res.data.noOfTimeSpin;

								if (this.templateType == 'HTML' && res.data.Post.htmlstring) {
									let html_string = JSON.parse(res.data.Post.htmlstring);
									this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html_string[0].pageString);
									setTimeout(() => {
										this.addEventListeners();
									}, 500);
								}

								if (res.data.submit) {
									this.clearCurrentDripData();
								}
								if (this.otherDetails.CampaignId) {
									this.getVimeoToken(this.otherDetails.CampaignId);
								}

								// this.templateType == 'Carousel' ||
								if (this.isDripClickAction == false && this.templateType == 'Single Image') {
									// this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
									// 	if (res.success) {
									// 	}
									// });
									this.isDripClickAction = true;
								}
								this.showCorrectAns = res.data.Post.showCorrectAns;
								this.quizResultType = res.data.Post.quizResultType;
								this.pollResultType = res.data.Post.pollResultType;
								if (this.quizResultType == 'Upon Submission') {
									this.showQuizAnswer = true;
								} else if (this.quizResultType == 'After the deadline') {
									let hours = parseInt(res.data.Post.timehours);
									let getCurentDate: any = moment().format();
									let publishOnDate = moment(res.data.publishOn).format();
									let triggerDateTime: any = moment(publishOnDate).add(hours, 'hours');
									let triggerDateTime_ = moment(triggerDateTime).format();

									if (moment(triggerDateTime_).isSameOrBefore(getCurentDate)) {
										this.showQuizAnswer = true;
									} else {
										this.showQuizAnswer = false;
									}
								}
								if (this.templateType == 'Carousel') {
									this.pagerValue = 'true';
								} else {
									this.pagerValue = 'false';
								}

								this.hyperlinkArray = [];
								if (res.data.hyperlink != null && res.data.hyperlink != undefined && res.data.hyperlink != '') {
									this.hyperlinkArray = res.data.hyperlink.split(',');
								}

								this.isSubmited = res.data.submit;
								this.score = res.data.score;
								this.clientId = res.data.Post.Client.id;
								let payload = {
									id: res.data.id,
									avatar: res.data.Post.Client.avatar_path,
									name: res.data.Post.Client.name,
									date: res.data.createdAt,
									images: [],
									likes: res.data.Post.isLikedCount,
									comments: 450,
									description: res.data.Post.caption,
									pwaheadtxt: res.data.Post.pwaheadtxt,
									submitText: res.data.Post.submitText,
									asset_details: [],
									briefAsset: [],
									briefAssetPreview: [],
									isLiked: res.data.isLiked,
									isBookmarked: res.data.isBookmarked,
									brief: res.data.Post.brief,
									clickExternalLink: res.data.clickExternalLink,
									externalLinkFlag: res.data?.Post?.externalLinkFlag,
									externalLinkLabel1: res.data?.Post?.externalLinkLabel1,
									externalLink1: res.data?.Post?.externalLink1,
									externalLinkLabel2: res.data?.Post?.externalLinkLabel2,
									externalLink2: res.data?.Post?.externalLink2,
									externalLinkLabel3: res.data?.Post?.externalLinkLabel3,
									externalLink3: res.data?.Post?.externalLink3,
									externalLinkLabel4: res.data?.Post?.externalLinkLabel4,
									externalLink4: res.data?.Post?.externalLink4,

									externalLinkLabel5: res.data?.Post?.externalLinkLabel5,
									externalLink5: res.data?.Post?.externalLink5,

									externalLinkLabel6: res.data?.Post?.externalLinkLabel6,
									externalLink6: res.data?.Post?.externalLink6,

									externalLinkLabel7: res.data?.Post?.externalLinkLabel7,
									externalLink7: res.data?.Post?.externalLink7,

									externalLinkLabel8: res.data?.Post?.externalLinkLabel8,
									externalLink8: res.data?.Post?.externalLink8,

									externalLinkLabel9: res.data?.Post?.externalLinkLabel9,
									externalLink9: res.data?.Post?.externalLink9,

									externalLinkLabel10: res.data?.Post?.externalLinkLabel10,
									externalLink10: res.data?.Post?.externalLink10,

									externalLink: res.data?.externalLink,
								};

								let temp = res.data.Post.Assets.sort((a, b) => {
									if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
										return -1;
									}
								});

								for (let asset of temp) {
									for (let assetDetail of asset.Asset_details) {
										if (assetDetail.displayType == 'Image') {
											payload.asset_details.push(assetDetail);
										}
										if (assetDetail.displayType == 'Video') {
											if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
												this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
											}
											payload.asset_details.push(assetDetail);
										}
										if (assetDetail.displayType == 'Link') {
											payload.asset_details.push(assetDetail);
										}
									}
								}
								if (res.data.Post && res.data.Post.Post_brief_assets.length > 0) {
									let temp_2 = res.data.Post.Post_brief_assets.sort((a, b) => {
										if (a.PostBriefAsset.index < b.PostBriefAsset.index) {
											return -1;
										}
									});

									for (let asset of temp_2) {
										for (let assetDetail_ of asset.Asset_details) {
											let assetDetail = assetDetail_;
											assetDetail.forPreview = asset.PostBriefAsset.forPreview;
											assetDetail.title = asset.title;
											if (
												['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
												!assetDetail.forPreview
											) {
												payload.briefAsset.push(assetDetail);
											} else if (
												['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
												assetDetail.forPreview
											) {
												payload.briefAssetPreview.push(assetDetail);
											}

											if (assetDetail.displayType == 'Video' && !assetDetail.forPreview) {
												if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
													this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
												}
												payload.briefAsset.push(assetDetail);
											} else if (assetDetail.displayType == 'Video' && assetDetail.forPreview) {
												if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
													this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
												}
												payload.briefAssetPreview.push(assetDetail);
											}
											// if (assetDetail.displayType == 'Link') {
											// 	payload.asset_details.push(assetDetail);
											// }
										}
									}
								}

								if (payload.description) {
									this.displayTextOrHyperLink(payload.description);
								}

								this.post = payload;
							}
							// this.selectedDripAllData = [];
							// this.selectedDripAllData = res.data;
							this.dripDetails = res.data;
							if (res.data.submit) {
								this.allQuesions = res.data.DripUserQuestions;
							} else {
								await this.updateUserPreviseActionInQuetion(res.data.DripUserQuestions);
							}
							if (res.data.submit) {
								setTimeout(() => {
									if (this.templateType == 'Poll') {
										this.selectedDripDetails = {
											campaign_id: res.data.CampaignId,
											drip_camp_Index: res.data.DripCampIndex,
											drip_camp_id: res.data.DripCampId,
											post_id: res.data.PostId,
										};
										this.appService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
											if (res.success) {
												this.selectedDripAllData = [];
												this.selectedDripAllData = res.data;
												setTimeout(() => {
													this.getDataForPollGraphResult();
												}, 200);
											}
										});
									}
								}, 200);
							}

							// ----------------------Spin The Wheel-------------------
							if (this.templateType == 'Spin The Wheel') {
								this.spinCategoryArray = [];
								this.assignUserSpinCategoryArray = [];
								let asssignSpinQue = JSON.parse(this.dripDetails.assignSpinQue);

								if (asssignSpinQue && asssignSpinQue.length > 0) {
									this.showSpinCategoryQuestion = true;
									for (let question of asssignSpinQue) {
										this.assignUserSpinCategoryArray.push(question);
									}
								}
							}

							let categoryList = [];
							let totalSpinScore = 0;
							let spinCatCount = 0;

							if (this.templateType == 'Spin The Wheel') {
								this.maxSpinCharCount = await this.findMaxQuesCharCount(this.allQuesions);
							}

							if (this.allQuesions.length > 0) {
								for (let question of this.allQuesions) {
									let count = 0;
									let answer = '';
									let que = question;
									question.answerStatus = '';
									let iscorrect = false;
									let iswrong = false;
									question.isSurveyQueNotSelected = false;
									question.mobileError = false;
									question.allowFileFormat = '.jpg, .png';
									question.userRatingArray = [];

									if (question.allowFileTypes == 'PDF') {
										question.allowFileFormat = '.pdf';
									}
									if (question.allowFileTypes == 'Video') {
										question.allowFileFormat = '.mp4';
									}

									if (this.templateType == 'Survey') {
										if (question.questionType == 'Date Time' || question.questionType == 'Date') {
											if (
												question.surveyNote == null ||
												question.surveyNote == '' ||
												question.surveyNote == undefined
											) {
												question.surveyNote = moment().format();
											}
										}

										if (question.questionType == 'Mobile No') {
											this.getAllCountryName();
											if (question.country == null || question.country == '' || question.country == undefined) {
												question.country = this.selectedCountryName ? this.selectedCountryName : 'India';
											}
										}

										if (question.questionType == 'Rating scale') {
											this.ratingScaleArray(question);
										}
									}

									// ----------------------Spin The Wheel-------------------
									if (
										this.templateType == 'Spin The Wheel' &&
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

										if (this.maxSpinCharCount == 15) {
											spinCategoryPayload.textFontSize = 12;
										} else if (this.maxSpinCharCount < 15 && this.maxSpinCharCount > 10) {
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

											this.spinCategoryArray.push(spinCategoryPayload);
											categoryList.push(question.spinCatIndex);
										}

										if (this.isSubmited) {
											// console.log('--assignUserSpinCategoryArray-', this.assignUserSpinCategoryArray);
											for (let spinqueIndex of this.assignUserSpinCategoryArray) {
												if (spinqueIndex == question.spinCatIndex) {
													// console.log('--spinqueIndex-', spinqueIndex);
													// console.log('--question.spinCatIndex-', question.spinCatIndex);
													// console.log('---------------------------------');
													totalSpinScore = question.spinQueScore;
													this.spinTheQuestionCount = this.spinTheQuestionCount + totalSpinScore;
												}
											}
										}
									}

									for (let option of que.DripUserOptions) {
										option.optVal = 0;
										option.optTotal = 0;
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

										if (iscorrect && !iswrong) {
											question.answerStatus = 'Correct';
										} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
											question.answerStatus = 'Partially Correct';
										} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
											question.answerStatus = 'Incorrect';
										} else if (!iscorrect && iswrong) {
											question.answerStatus = 'Incorrect';
										}
										if (option.correctAns === true) {
											count++;
										}
										if (option.selectedAns) {
											answer = option.text;
										}
										if (
											(this.templateType == 'Poll' && option.selectedAns) ||
											(this.templateType == 'Survey' && option.selectedAns)
										) {
											question.selectedAnswer = option.text;
										}
									}
									if (count > 1) {
										question.questionType = 'multiCorrectAns';
									} else if (count == 1) {
										question.selectedAnswer = answer;
									}

									if (this.templateType == 'Survey' && question.multipleOption) {
										question.questionType = 'multiCorrectAns';
									}

									if (question.questionType == 'Drag and Drop' && question.DripUserOptions) {
										if (question.DripUserOptions[0].userSeq == 0 || question.DripUserOptions[0].userSeq == null) {
											let options = question.DripUserOptions.sort(() => Math.random() - 0.5);
											question.DripUserOptions = [];
											question.DripUserOptions = options;
											let count = 1;
											for (let data of options) {
												data.userSeq = count;
												count++;
											}
											this.updateDripLocalData();

											// let payload = {
											// 	options: options,
											// 	isDripClickAction: this.isDripClickActionForDrag,
											// };
											// this.appService.submitDripSequency(payload, this.id).subscribe((res: any) => {
											// 	if (res.success) {
											// 		this.isDripClickActionForDrag = true;
											// 		for (let question of this.allQuesions) {
											// 			if (question.id == res.data[0].DripUserQuestionId) {
											// 				question.DripUserOptions = res.data;
											// 				this.allQuesOptions = [];
											// 				for (let option of question.DripUserOptions) {
											// 					this.allQuesOptions.push(option);
											// 				}
											// 			}
											// 		}
											// 	}
											// });
										} else {
											let temp = question.DripUserOptions.sort((a, b) => {
												if (a.userSeq < b.userSeq) {
													return -1;
												}
											});
											question.DripUserOptions = temp;
											this.allQuesOptions = [];
											for (let option of question.DripUserOptions) {
												this.allQuesOptions.push(option);
											}
										}
									}
								}
							}
							if (this.templateType == 'Offline Task' || this.templateType == 'Survey') {
								this.checkTrancecoding();
							}

							//to clear previous selection only for spin the wheel
							if (this.templateType == 'Spin The Wheel' && !this.isSubmited && this.spinAPIcounter <= 0) {
								this.clearForm();
								this.spinAPIcounter++;
							}
						}
						this.addDefaultValues();
						this.dismiss();
					} else {
						this.dismiss();
					}
				} catch (error) {
					console.log('getDripData error.......', error);
					this.dismiss();
				}
			},
			(error: any) => {
				this.dismiss();
			}
		);
	}

	// Using Admin Get Link
	getDripDataByUserIdAndDripId() {
		this.appService
			.getDripDataByUserIdAndDripId(this.incomingPostId, this.userDetails.id)
			.subscribe(async (data: any) => {
				if (data.success) {
					let dripData = await this.formatData(data.data);
					let res = {
						data: dripData,
					};
					if (res.data.Post) {
						this.consumed = res.data.consumed;
						this.id = res.data.id;
						this.removeDripLocalOldData();
						this.userId = res.data.UserId;
						this.isDripClickAction = res.data.isDripClickAction;
						this.isDripClickActionForDrag = res.data.isDripClickAction;
						this.templateType = res.data.Post.tempType;
						if (this.templateType == 'Custom Template') {
							// this.navCtrl.navigateForward(['/custom-template']);
							this.navCtrl.navigateForward(['/custom-template'], {
								state: { data: res.data },
							});
						}
						this.showBackButton = res.data.Post.showBackButton;
						this.showCorrectAns = res.data.Post.showCorrectAns;
						this.quizResultType = res.data.Post.quizResultType;
						this.pollResultType = res.data.Post.pollResultType;
						this.appBrandingInfo = res.data.System_branding;
						this.isApiLoad = true;
						//spin the wheel
						this.noOfTimeSpin = res.data.noOfTimeSpin;

						if (this.templateType == 'HTML' && res.data.Post.htmlstring) {
							let html_string = JSON.parse(res.data.Post.htmlstring);
							this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html_string[0].pageString);
							setTimeout(() => {
								this.addEventListeners();
							}, 500);
						}

						if (res.data.submit) {
							this.clearCurrentDripData();
						}
						if (this.quizResultType == 'Upon Submission') {
							this.showQuizAnswer = true;
						} else if (this.quizResultType == 'After the deadline') {
							let hours = parseInt(res.data.Post.timehours);
							let getCurentDate: any = moment().format();
							let publishOnDate = moment(res.data.publishOn).format();
							let triggerDateTime: any = moment(publishOnDate).add(hours, 'hours');
							let triggerDateTime_ = moment(triggerDateTime).format();

							if (moment(triggerDateTime_).isSameOrBefore(getCurentDate)) {
								this.showQuizAnswer = true;
							} else {
								this.showQuizAnswer = false;
							}
						}
						this.otherDetails.CampaignId = res.data.CampaignId;
						this.otherDetails.PostId = res.data.PostId;
						this.otherDetails.UserId = res.data.UserId;
						this.otherDetails.DripCampIndex = res.data.DripCampIndex;

						if (this.otherDetails.CampaignId) {
							this.getVimeoToken(this.otherDetails.CampaignId);
						}
						// this.templateType == 'Carousel' ||
						if (this.isDripClickAction == false && this.templateType == 'Single Image') {
							// this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
							// 	if (res.success) {
							// 	}
							// });
							this.isDripClickAction = true;
						}

						if (this.templateType == 'Carousel') {
							this.pagerValue = 'true';
						} else {
							this.pagerValue = 'false';
						}

						this.hyperlinkArray = [];
						if (res.data.hyperlink != null && res.data.hyperlink != undefined && res.data.hyperlink != '') {
							this.hyperlinkArray = res.data.hyperlink.split(',');
						}
						this.isSubmited = res.data.submit;
						this.score = res.data.score;
						this.clientId = res.data.Post.Client.id;
						let payload = {
							id: res.data.id,
							avatar: res.data.Post.Client.avatar_path,
							name: res.data.Post.Client.name,
							date: res.data.createdAt,
							images: [],
							likes: res.data.Post.isLikedCount,
							comments: 450,
							description: res.data.Post.caption,
							pwaheadtxt: res.data.Post.pwaheadtxt,
							submitText: res.data.Post.submitText,
							asset_details: [],
							briefAsset: [],
							briefAssetPreview: [],
							isLiked: res.data.isLiked,
							isBookmarked: res.data.isBookmarked,
							brief: res.data.Post.brief,
							clickExternalLink: res.data.clickExternalLink,
							externalLinkFlag: res.data?.Post?.externalLinkFlag,
							externalLinkLabel1: res.data?.Post?.externalLinkLabel1,
							externalLink1: res.data?.Post?.externalLink1,
							externalLinkLabel2: res.data?.Post?.externalLinkLabel2,
							externalLink2: res.data?.Post?.externalLink2,
							externalLinkLabel3: res.data?.Post?.externalLinkLabel3,
							externalLink3: res.data?.Post?.externalLink3,
							externalLinkLabel4: res.data?.Post?.externalLinkLabel4,
							externalLink4: res.data?.Post?.externalLink4,

							externalLinkLabel5: res.data?.Post?.externalLinkLabel5,
							externalLink5: res.data?.Post?.externalLink5,

							externalLinkLabel6: res.data?.Post?.externalLinkLabel6,
							externalLink6: res.data?.Post?.externalLink6,

							externalLinkLabel7: res.data?.Post?.externalLinkLabel7,
							externalLink7: res.data?.Post?.externalLink7,

							externalLinkLabel8: res.data?.Post?.externalLinkLabel8,
							externalLink8: res.data?.Post?.externalLink8,

							externalLinkLabel9: res.data?.Post?.externalLinkLabel9,
							externalLink9: res.data?.Post?.externalLink9,

							externalLinkLabel10: res.data?.Post?.externalLinkLabel10,
							externalLink10: res.data?.Post?.externalLink10,
							externalLink: res.data?.externalLink,
						};

						let temp = res.data.Post.Assets.sort((a, b) => {
							if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
								return -1;
							}
						});

						for (let asset of temp) {
							for (let assetDetail of asset.Asset_details) {
								if (assetDetail.displayType == 'Image') {
									payload.asset_details.push(assetDetail);
								}
								if (assetDetail.displayType == 'Video') {
									if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
										this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
									}
									payload.asset_details.push(assetDetail);
								}
								if (assetDetail.displayType == 'Link') {
									payload.asset_details.push(assetDetail);
								}
							}
						}
						if (res.data.Post && res.data.Post.Post_brief_assets.length > 0) {
							let temp_2 = res.data.Post.Post_brief_assets.sort((a, b) => {
								if (a.PostBriefAsset.index < b.PostBriefAsset.index) {
									return -1;
								}
							});

							for (let asset of temp_2) {
								for (let assetDetail_ of asset.Asset_details) {
									let assetDetail = assetDetail_;
									assetDetail.forPreview = asset.PostBriefAsset.forPreview;
									assetDetail.title = asset.title;
									if (
										['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
										!assetDetail.forPreview
									) {
										payload.briefAsset.push(assetDetail);
									} else if (
										['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
										assetDetail.forPreview
									) {
										payload.briefAssetPreview.push(assetDetail);
									}

									if (assetDetail.displayType == 'Video' && !assetDetail.forPreview) {
										if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
											this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
										}
										payload.briefAsset.push(assetDetail);
									} else if (assetDetail.displayType == 'Video' && assetDetail.forPreview) {
										if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
											this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
										}
										payload.briefAssetPreview.push(assetDetail);
									}
									// if (assetDetail.displayType == 'Link') {
									// 	payload.asset_details.push(assetDetail);
									// }
								}
							}
						}

						if (payload.description) {
							this.displayTextOrHyperLink(payload.description);
						}
						this.post = payload;
					}
					// this.selectedDripAllData = [];
					// this.selectedDripAllData = res.data;
					this.dripDetails = res.data;
					if (res.data.submit) {
						this.allQuesions = res.data.DripUserQuestions;
					} else {
						await this.updateUserPreviseActionInQuetion(res.data.DripUserQuestions);
					}
					if (res.data.submit) {
						setTimeout(() => {
							if (this.templateType == 'Poll') {
								this.selectedDripDetails = {
									campaign_id: res.data.CampaignId,
									drip_camp_Index: res.data.DripCampIndex,
									drip_camp_id: res.data.DripCampId,
									post_id: res.data.PostId,
								};
								this.appService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
									if (res.success) {
										this.selectedDripAllData = [];
										this.selectedDripAllData = res.data;
										setTimeout(() => {
											this.getDataForPollGraphResult();
										}, 200);
									}
								});
							}
						}, 200);
					}

					// ----------------------Spin The Wheel-------------------
					if (this.templateType == 'Spin The Wheel') {
						this.spinCategoryArray = [];
						this.assignUserSpinCategoryArray = [];
						let asssignSpinQue = JSON.parse(this.dripDetails.assignSpinQue);

						if (asssignSpinQue && asssignSpinQue.length > 0) {
							this.showSpinCategoryQuestion = true;
							for (let question of asssignSpinQue) {
								this.assignUserSpinCategoryArray.push(question);
							}
						}
					}

					let categoryList = [];
					let totalSpinScore = 0;
					let spinCatCount = 0;

					if (this.templateType == 'Spin The Wheel') {
						this.maxSpinCharCount = await this.findMaxQuesCharCount(this.allQuesions);
					}

					if (this.allQuesions.length > 0) {
						for (let question of this.allQuesions) {
							let count = 0;
							let answer = '';
							let que = question;
							question.answerStatus = '';
							let iscorrect = false;
							let iswrong = false;
							question.isSurveyQueNotSelected = false;
							question.mobileError = false;
							question.allowFileFormat = '.jpg, .png';
							question.userRatingArray = [];

							if (question.allowFileTypes == 'PDF') {
								question.allowFileFormat = '.pdf';
							}
							if (question.allowFileTypes == 'Video') {
								question.allowFileFormat = '.mp4';
							}

							if (this.templateType == 'Survey') {
								if (question.questionType == 'Date Time' || question.questionType == 'Date') {
									if (question.surveyNote == null || question.surveyNote == '' || question.surveyNote == undefined) {
										question.surveyNote = moment().format();
									}
								}
								if (question.questionType == 'Mobile No') {
									this.getAllCountryName();
									if (question.country == null || question.country == '' || question.country == undefined) {
										question.country = this.selectedCountryName ? this.selectedCountryName : 'India';
									}
								}

								if (question.questionType == 'Rating scale') {
									this.ratingScaleArray(question);
								}
							}

							// ----------------------Spin The Wheel-------------------
							if (
								this.templateType == 'Spin The Wheel' &&
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

								if (this.maxSpinCharCount == 15) {
									spinCategoryPayload.textFontSize = 12;
								} else if (this.maxSpinCharCount < 15 && this.maxSpinCharCount > 10) {
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

									this.spinCategoryArray.push(spinCategoryPayload);
									categoryList.push(question.spinCatIndex);
								}

								if (this.isSubmited) {
									for (let spinqueIndex of this.assignUserSpinCategoryArray) {
										if (spinqueIndex == question.spinCatIndex) {
											totalSpinScore = question.spinQueScore;
											this.spinTheQuestionCount = this.spinTheQuestionCount + totalSpinScore;
										}
									}
								}
							}

							for (let option of que.DripUserOptions) {
								option.optVal = 0;
								option.optTotal = 0;
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

								if (iscorrect && !iswrong) {
									question.answerStatus = 'Correct';
								} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
									question.answerStatus = 'Partially Correct';
								} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
									question.answerStatus = 'Incorrect';
								} else if (!iscorrect && iswrong) {
									question.answerStatus = 'Incorrect';
								}

								if (option.correctAns == true) {
									count++;
								}
								if (option.selectedAns) {
									answer = option.text;
								}
								if (
									(this.templateType == 'Poll' && option.selectedAns) ||
									(this.templateType == 'Survey' && option.selectedAns)
								) {
									question.selectedAnswer = option.text;
								}
							}
							if (count > 1) {
								question.questionType = 'multiCorrectAns';
							} else if (count == 1) {
								question.selectedAnswer = answer;
							}

							if (this.templateType == 'Survey' && question.multipleOption) {
								question.questionType = 'multiCorrectAns';
							}

							if (question.questionType == 'Drag and Drop' && question.DripUserOptions) {
								if (question.DripUserOptions[0].userSeq == 0 || question.DripUserOptions[0].userSeq == null) {
									let options = question.DripUserOptions.sort(() => Math.random() - 0.5);
									question.DripUserOptions = [];
									question.DripUserOptions = options;
									let count = 1;
									for (let data of options) {
										data.userSeq = count;
										count++;
									}
									this.updateDripLocalData();

									// let payload = {
									// 	options: options,
									// 	isDripClickAction: this.isDripClickActionForDrag,
									// };
									// this.appService.submitDripSequency(payload, this.id).subscribe((res: any) => {
									// 	if (res.success) {
									// 		this.isDripClickActionForDrag = true;
									// 		for (let question of this.allQuesions) {
									// 			if (question.id == res.data[0].DripUserQuestionId) {
									// 				question.DripUserOptions = res.data;
									// 				this.allQuesOptions = [];
									// 				for (let option of question.DripUserOptions) {
									// 					this.allQuesOptions.push(option);
									// 				}
									// 			}
									// 		}
									// 	}
									// });
								} else {
									let temp = question.DripUserOptions.sort((a, b) => {
										if (a.userSeq < b.userSeq) {
											return -1;
										}
									});
									question.DripUserOptions = temp;
									this.allQuesOptions = [];
									for (let option of question.DripUserOptions) {
										this.allQuesOptions.push(option);
									}
								}
							}
						}
					}

					if (this.templateType == 'Offline Task' || this.templateType == 'Survey') {
						this.checkTrancecoding();
					}

					//to clear previous selection only for spin the wheel
					if (this.templateType == 'Spin The Wheel' && !this.isSubmited && this.spinAPIcounter <= 0) {
						this.clearForm();
						this.spinAPIcounter++;
					}

					this.addDefaultValues();
				}
			});
	}

	//Main URL
	async getPostByUserId() {
		if (this.isLoading == false) {
			await this.showLoading();
		}
		this.appService.getDripDataByUId(this.incomingPostId, this.id).subscribe(
			async (data: any) => {
				try {
					if (data.success) {
						let dripData = await this.formatData(data.data);
						let res = {
							data: dripData,
						};
						if (res.data.Post) {
							this.consumed = res.data.consumed;
							this.id = res.data.id;
							this.userId = res.data.UserId;
							this.isDripClickAction = res.data.isDripClickAction;
							this.isDripClickActionForDrag = res.data.isDripClickAction;
							this.templateType = res.data.Post.tempType;
							this.showBackButton = res.data.Post.showBackButton;
							this.showCorrectAns = res.data.Post.showCorrectAns;
							this.quizResultType = res.data.Post.quizResultType;
							this.pollResultType = res.data.Post.pollResultType;
							this.appBrandingInfo = res.data.System_branding;
							this.isApiLoad = true;

							//spin the wheel
							this.noOfTimeSpin = res.data.noOfTimeSpin;
							if (this.templateType == 'HTML' && res.data.Post.htmlstring) {
								let html_string = JSON.parse(res.data.Post.htmlstring);
								this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html_string[0].pageString);
								setTimeout(() => {
									this.addEventListeners();
								}, 500);
							}

							this.removeDripLocalOldData();
							if (res.data.submit) {
								this.clearCurrentDripData();
							}
							if (this.quizResultType == 'Upon Submission') {
								this.showQuizAnswer = true;
							} else if (this.quizResultType == 'After the deadline') {
								let hours = parseInt(res.data.Post.timehours);
								let getCurentDate: any = moment().format();
								let publishOnDate = moment(res.data.publishOn).format();
								let triggerDateTime: any = moment(publishOnDate).add(hours, 'hours');
								let triggerDateTime_ = moment(triggerDateTime).format();

								if (moment(triggerDateTime_).isSameOrBefore(getCurentDate)) {
									this.showQuizAnswer = true;
								} else {
									this.showQuizAnswer = false;
								}
							}
							this.otherDetails.CampaignId = res.data.CampaignId;
							this.otherDetails.PostId = res.data.PostId;
							this.otherDetails.UserId = res.data.UserId;
							this.otherDetails.DripCampIndex = res.data.DripCampIndex;

							if (this.otherDetails.CampaignId) {
								this.getVimeoToken(this.otherDetails.CampaignId);
							}
							// this.templateType == 'Carousel' ||
							if (this.isDripClickAction == false && this.templateType == 'Single Image') {
								// this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
								// 	if (res.success) {
								// 	}
								// });
								this.isDripClickAction = true;
							}

							if (this.templateType == 'Carousel') {
								this.pagerValue = 'true';
							} else {
								this.pagerValue = 'false';
							}

							this.hyperlinkArray = [];
							if (res.data.hyperlink != null && res.data.hyperlink != undefined && res.data.hyperlink != '') {
								this.hyperlinkArray = res.data.hyperlink.split(',');
							}

							this.isSubmited = res.data.submit;
							this.score = res.data.score;
							this.clientId = res.data.Post.Client.id;
							let payload = {
								id: res.data.id,
								avatar: res.data.Post.Client.avatar_path,
								name: res.data.Post.Client.name,
								date: res.data.createdAt,
								images: [],
								likes: res.data.Post.isLikedCount,
								comments: 450,
								description: res.data.Post.caption,
								pwaheadtxt: res.data.Post.pwaheadtxt,
								submitText: res.data.Post.submitText,
								asset_details: [],
								briefAsset: [],
								briefAssetPreview: [],
								isLiked: res.data.isLiked,
								isBookmarked: res.data.isBookmarked,
								brief: res.data.Post.brief,
								clickExternalLink: res.data.clickExternalLink,
								externalLinkFlag: res.data?.Post?.externalLinkFlag,
								externalLinkLabel1: res.data?.Post?.externalLinkLabel1,
								externalLink1: res.data?.Post?.externalLink1,
								externalLinkLabel2: res.data?.Post?.externalLinkLabel2,
								externalLink2: res.data?.Post?.externalLink2,
								externalLinkLabel3: res.data?.Post?.externalLinkLabel3,
								externalLink3: res.data?.Post?.externalLink3,
								externalLinkLabel4: res.data?.Post?.externalLinkLabel4,
								externalLink4: res.data?.Post?.externalLink4,

								externalLinkLabel5: res.data?.Post?.externalLinkLabel5,
								externalLink5: res.data?.Post?.externalLink5,

								externalLinkLabel6: res.data?.Post?.externalLinkLabel6,
								externalLink6: res.data?.Post?.externalLink6,

								externalLinkLabel7: res.data?.Post?.externalLinkLabel7,
								externalLink7: res.data?.Post?.externalLink7,

								externalLinkLabel8: res.data?.Post?.externalLinkLabel8,
								externalLink8: res.data?.Post?.externalLink8,

								externalLinkLabel9: res.data?.Post?.externalLinkLabel9,
								externalLink9: res.data?.Post?.externalLink9,

								externalLinkLabel10: res.data?.Post?.externalLinkLabel10,
								externalLink10: res.data?.Post?.externalLink10,

								externalLink: res.data?.externalLink,
							};

							let temp = res.data.Post.Assets.sort((a, b) => {
								if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
									return -1;
								}
							});

							for (let asset of temp) {
								for (let assetDetail of asset.Asset_details) {
									if (assetDetail.displayType == 'Image') {
										payload.asset_details.push(assetDetail);
									}
									if (assetDetail.displayType == 'Video') {
										if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
											this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.vimeoLink);
										} else if (assetDetail.displayType == 'Video' && !assetDetail.isTranscoding) {
											this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
										}
										payload.asset_details.push(assetDetail);
									}
									if (assetDetail.displayType == 'Link') {
										payload.asset_details.push(assetDetail);
									}
								}
							}

							if (res.data.Post && res.data.Post.Post_brief_assets.length > 0) {
								let temp_2 = res.data.Post.Post_brief_assets.sort((a, b) => {
									if (a.PostBriefAsset.index < b.PostBriefAsset.index) {
										return -1;
									}
								});

								for (let asset of temp_2) {
									for (let assetDetail_ of asset.Asset_details) {
										let assetDetail = assetDetail_;
										assetDetail.forPreview = asset.PostBriefAsset.forPreview;
										assetDetail.title = asset.title;
										if (
											['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
											!assetDetail.forPreview
										) {
											payload.briefAsset.push(assetDetail);
										} else if (
											['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
											assetDetail.forPreview
										) {
											payload.briefAssetPreview.push(assetDetail);
										}

										if (assetDetail.displayType == 'Video' && !assetDetail.forPreview) {
											if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
												this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
											}
											payload.briefAsset.push(assetDetail);
										} else if (assetDetail.displayType == 'Video' && assetDetail.forPreview) {
											if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
												this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
											}
											payload.briefAssetPreview.push(assetDetail);
										}
										// if (assetDetail.displayType == 'Link') {
										// 	payload.asset_details.push(assetDetail);
										// }
									}
								}
							}

							if (payload.description) {
								this.displayTextOrHyperLink(payload.description);
							}
							this.post = payload;
						}
						this.dripDetails = res.data;
						if (res.data.submit) {
							this.allQuesions = res.data.DripUserQuestions;
						} else {
							await this.updateUserPreviseActionInQuetion(res.data.DripUserQuestions);
						}
						if (res.data.submit) {
							setTimeout(() => {
								if (this.templateType == 'Poll') {
									this.selectedDripDetails = {
										campaign_id: res.data.CampaignId,
										drip_camp_Index: res.data.DripCampIndex,
										drip_camp_id: res.data.DripCampId,
										post_id: res.data.PostId,
									};
									this.appService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
										if (res.success) {
											this.selectedDripAllData = [];
											this.selectedDripAllData = res.data;
											setTimeout(() => {
												this.getDataForPollGraphResult();
											}, 200);
										}
									});
								}
							}, 200);
						}

						// ----------------------Spin The Wheel-------------------
						if (this.templateType == 'Spin The Wheel') {
							this.spinCategoryArray = [];
							this.assignUserSpinCategoryArray = [];
							let asssignSpinQue = JSON.parse(this.dripDetails.assignSpinQue);

							if (asssignSpinQue && asssignSpinQue.length > 0) {
								this.showSpinCategoryQuestion = true;
								for (let question of asssignSpinQue) {
									this.assignUserSpinCategoryArray.push(question);
								}
							}
						}

						let categoryList = [];
						let totalSpinScore = 0;
						let spinCatCount = 0;

						if (this.templateType == 'Spin The Wheel') {
							this.maxSpinCharCount = await this.findMaxQuesCharCount(this.allQuesions);
						}

						if (this.allQuesions.length > 0) {
							for (let question of this.allQuesions) {
								let count = 0;
								let answer = '';
								let que = question;
								question.answerStatus = '';
								let iscorrect = false;
								let iswrong = false;
								question.isSurveyQueNotSelected = false;
								question.mobileError = false;
								question.allowFileFormat = '.jpg, .png';
								question.userRatingArray = [];

								if (question.allowFileTypes == 'PDF') {
									question.allowFileFormat = '.pdf';
								}
								if (question.allowFileTypes == 'Video') {
									question.allowFileFormat = '.mp4';
								}

								if (this.templateType == 'Survey') {
									if (question.questionType == 'Date Time' || question.questionType == 'Date') {
										if (question.surveyNote == null || question.surveyNote == '' || question.surveyNote == undefined) {
											question.surveyNote = moment().format();
										}
									}

									if (question.questionType == 'Mobile No') {
										this.getAllCountryName();
										if (question.country == null || question.country == '' || question.country == undefined) {
											question.country = this.selectedCountryName ? this.selectedCountryName : 'India';
										}
									}

									if (question.questionType == 'Rating scale') {
										this.ratingScaleArray(question);
									}
								}

								// ----------------------Spin The Wheel-------------------
								if (
									this.templateType == 'Spin The Wheel' &&
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

									if (this.maxSpinCharCount == 15) {
										spinCategoryPayload.textFontSize = 12;
									} else if (this.maxSpinCharCount < 15 && this.maxSpinCharCount > 10) {
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

										this.spinCategoryArray.push(spinCategoryPayload);
										categoryList.push(question.spinCatIndex);
									}

									if (this.isSubmited) {
										// console.log('--assignUserSpinCategoryArray-', this.assignUserSpinCategoryArray);
										for (let spinqueIndex of this.assignUserSpinCategoryArray) {
											if (spinqueIndex == question.spinCatIndex) {
												// console.log('--spinqueIndex-', spinqueIndex);
												// console.log('--question.spinCatIndex-', question.spinCatIndex);
												// console.log('---------------------------------');
												totalSpinScore = question.spinQueScore;
												this.spinTheQuestionCount = this.spinTheQuestionCount + totalSpinScore;
											}
										}
									}
								}

								for (let option of que.DripUserOptions) {
									option.optVal = 0;
									option.optTotal = 0;
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

									if (iscorrect && !iswrong) {
										question.answerStatus = 'Correct';
									} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
										question.answerStatus = 'Partially Correct';
									} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
										question.answerStatus = 'Incorrect';
									} else if (!iscorrect && iswrong) {
										question.answerStatus = 'Incorrect';
									}

									if (option.correctAns == true) {
										count++;
									}
									if (option.selectedAns) {
										answer = option.text;
									}
									if (
										(this.templateType == 'Poll' && option.selectedAns) ||
										(this.templateType == 'Survey' && option.selectedAns)
									) {
										question.selectedAnswer = option.text;
									}
								}
								if (count > 1) {
									question.questionType = 'multiCorrectAns';
								} else if (count == 1) {
									question.selectedAnswer = answer;
								}

								if (this.templateType == 'Survey' && question.multipleOption) {
									question.questionType = 'multiCorrectAns';
								}

								if (question.questionType == 'Drag and Drop' && question.DripUserOptions) {
									if (question.DripUserOptions[0].userSeq == 0 || question.DripUserOptions[0].userSeq == null) {
										let options = question.DripUserOptions.sort(() => Math.random() - 0.5);
										question.DripUserOptions = [];
										question.DripUserOptions = options;
										let count = 1;
										for (let data of options) {
											data.userSeq = count;
											count++;
										}
										this.updateDripLocalData();

										// let payload = {
										// 	options: options,
										// 	isDripClickAction: this.isDripClickActionForDrag,
										// };
										// this.appService.submitDripSequency(payload, this.id).subscribe((res: any) => {
										// 	if (res.success) {
										// 		this.isDripClickActionForDrag = true;
										// 		for (let question of this.allQuesions) {
										// 			if (question.id == res.data[0].DripUserQuestionId) {
										// 				question.DripUserOptions = res.data;
										// 				this.allQuesOptions = [];
										// 				for (let option of question.DripUserOptions) {
										// 					this.allQuesOptions.push(option);
										// 				}
										// 			}
										// 		}
										// 	}
										// });
									} else {
										let temp = question.DripUserOptions.sort((a, b) => {
											if (a.userSeq < b.userSeq) {
												return -1;
											}
										});
										question.DripUserOptions = temp;
										this.allQuesOptions = [];
										for (let option of question.DripUserOptions) {
											this.allQuesOptions.push(option);
										}
									}
								}

								if (this.templateType == 'Offline Task' || this.templateType == 'Survey') {
									this.checkTrancecoding();
								}
							}
						}

						//to clear previous selection only for spin the wheel
						if (this.templateType == 'Spin The Wheel' && !this.isSubmited && this.spinAPIcounter <= 0) {
							this.clearForm();
							this.spinAPIcounter++;
						}

						this.addDefaultValues();
						this.dismiss();
					} else {
						this.dismiss();
					}
				} catch (error) {
					console.log('getPostByUserId error.........', error);
					this.dismiss();
				}
			},
			(error: any) => {
				this.dismiss();
			}
		);
	}

	//Using Drip Code
	async getPostByDripCode(drip_code) {
		await this.showLoading();
		this.appService.getDripDataByDripCode(drip_code).subscribe(
			async (data: any) => {
				try {
					if (data.success) {
						if (data.isExternalLink) {
							//Only WhatsApp Native ExterNal Link
							window.open(`${data.externalLink}`, '_self');
							return;
						} else {
							let dripData = await this.formatData(data.data);
							let res = {
								data: dripData,
							};

							if (res.data.Post) {
								this.consumed = res.data.consumed;
								this.id = res.data.id;
								this.userId = res.data.UserId;
								this.incomingPostId = res.data.PostId;
								if (res.data && res.data.Post && res.data.Post.requiredLogging && !localStorage.getItem('user')) {
									this.dismiss();
									localStorage.setItem('singleDripWithLogin', this.incomingPostId);
									localStorage.setItem('singleDripWithLoginDripCode', drip_code);
									this.navCtrl.navigateForward(['/login']);
									return;
								}
								if (res.data.expiredOn && moment().isAfter(moment(res.data.expiredOn).format())) {
									this.dismiss();
									this.presentToast(this.appService.getTranslation('Utils.dripExpire'));
									this.clearCurrentDripData();
									this.navCtrl.navigateForward(['/login']);
									return;
								}
								this.isDripClickAction = res.data.isDripClickAction;
								this.isDripClickActionForDrag = res.data.isDripClickAction;
								this.templateType = res.data.Post.tempType;
								if (this.templateType == 'Custom Template') {
									this.navCtrl.navigateForward(['/custom-template'], {
										state: { data: res.data },
									});
								}
								this.showBackButton = res.data.Post.showBackButton;
								this.showCorrectAns = res.data.Post.showCorrectAns;
								this.quizResultType = res.data.Post.quizResultType;
								this.pollResultType = res.data.Post.pollResultType;
								this.appBrandingInfo = res.data.System_branding;
								this.isApiLoad = true;
								//spin the wheel
								this.noOfTimeSpin = res.data.noOfTimeSpin;

								if (this.templateType == 'HTML' && res.data.Post.htmlstring) {
									let html_string = JSON.parse(res.data.Post.htmlstring);
									this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html_string[0].pageString);
									setTimeout(() => {
										this.addEventListeners();
									}, 500);
								}

								this.removeDripLocalOldData();
								if (res.data.submit) {
									this.clearCurrentDripData();
								}
								if (this.quizResultType == 'Upon Submission') {
									this.showQuizAnswer = true;
								} else if (this.quizResultType == 'After the deadline') {
									let hours = parseInt(res.data.Post.timehours);
									let getCurentDate: any = moment().format();
									let publishOnDate = moment(res.data.publishOn).format();
									let triggerDateTime: any = moment(publishOnDate).add(hours, 'hours');
									let triggerDateTime_ = moment(triggerDateTime).format();

									if (moment(triggerDateTime_).isSameOrBefore(getCurentDate)) {
										this.showQuizAnswer = true;
									} else {
										this.showQuizAnswer = false;
									}
								}
								this.otherDetails.CampaignId = res.data.CampaignId;
								this.otherDetails.PostId = res.data.PostId;
								this.otherDetails.UserId = res.data.UserId;
								this.otherDetails.DripCampIndex = res.data.DripCampIndex;
								this.id = res.data.id;
								if (this.otherDetails.CampaignId) {
									this.getVimeoToken(this.otherDetails.CampaignId);
								}
								// this.templateType == 'Carousel' ||
								if (this.isDripClickAction == false && this.templateType == 'Single Image') {
									// this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
									// 	if (res.success) {
									// 	}
									// });
									this.isDripClickAction = true;
								}

								if (this.templateType == 'Carousel') {
									this.pagerValue = 'true';
								} else {
									this.pagerValue = 'false';
								}

								this.hyperlinkArray = [];
								if (res.data.hyperlink != null && res.data.hyperlink != undefined && res.data.hyperlink != '') {
									this.hyperlinkArray = res.data.hyperlink.split(',');
								}

								this.isSubmited = res.data.submit;
								this.score = res.data.score;
								this.clientId = res.data.Post.Client.id;
								let payload = {
									id: res.data.id,
									avatar: res.data.Post.Client.avatar_path,
									name: res.data.Post.Client.name,
									date: res.data.createdAt,
									images: [],
									likes: res.data.Post.isLikedCount,
									comments: 450,
									description: res.data.Post.caption,
									pwaheadtxt: res.data.Post.pwaheadtxt,
									submitText: res.data.Post.submitText,
									asset_details: [],
									briefAsset: [],
									briefAssetPreview: [],
									isLiked: res.data.isLiked,
									isBookmarked: res.data.isBookmarked,
									brief: res.data.Post.brief,
									clickExternalLink: res.data.clickExternalLink,
									externalLinkFlag: res.data?.Post?.externalLinkFlag,
									externalLinkLabel1: res.data?.Post?.externalLinkLabel1,
									externalLink1: res.data?.Post?.externalLink1,
									externalLinkLabel2: res.data?.Post?.externalLinkLabel2,
									externalLink2: res.data?.Post?.externalLink2,
									externalLinkLabel3: res.data?.Post?.externalLinkLabel3,
									externalLink3: res.data?.Post?.externalLink3,
									externalLinkLabel4: res.data?.Post?.externalLinkLabel4,
									externalLink4: res.data?.Post?.externalLink4,

									externalLinkLabel5: res.data?.Post?.externalLinkLabel5,
									externalLink5: res.data?.Post?.externalLink5,

									externalLinkLabel6: res.data?.Post?.externalLinkLabel6,
									externalLink6: res.data?.Post?.externalLink6,

									externalLinkLabel7: res.data?.Post?.externalLinkLabel7,
									externalLink7: res.data?.Post?.externalLink7,

									externalLinkLabel8: res.data?.Post?.externalLinkLabel8,
									externalLink8: res.data?.Post?.externalLink8,

									externalLinkLabel9: res.data?.Post?.externalLinkLabel9,
									externalLink9: res.data?.Post?.externalLink9,

									externalLinkLabel10: res.data?.Post?.externalLinkLabel10,
									externalLink10: res.data?.Post?.externalLink10,
									externalLink: res.data?.externalLink,
								};

								let temp = res.data.Post.Assets.sort((a, b) => {
									if (a.Post_asset_mapping.index < b.Post_asset_mapping.index) {
										return -1;
									}
								});

								for (let asset of temp) {
									for (let assetDetail of asset.Asset_details) {
										if (assetDetail.displayType == 'Image') {
											payload.asset_details.push(assetDetail);
										}
										if (assetDetail.displayType == 'Video') {
											if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
												this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.vimeoLink);
											} else if (assetDetail.displayType == 'Video' && !assetDetail.isTranscoding) {
												this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
											}
											payload.asset_details.push(assetDetail);
										}
										if (assetDetail.displayType == 'Link') {
											payload.asset_details.push(assetDetail);
										}
									}
								}

								if (res.data.Post && res.data.Post.Post_brief_assets.length > 0) {
									let temp_2 = res.data.Post.Post_brief_assets.sort((a, b) => {
										if (a.PostBriefAsset.index < b.PostBriefAsset.index) {
											return -1;
										}
									});

									for (let asset of temp_2) {
										for (let assetDetail_ of asset.Asset_details) {
											let assetDetail = assetDetail_;
											assetDetail.forPreview = asset.PostBriefAsset.forPreview;
											assetDetail.title = asset.title;
											if (
												['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
												!assetDetail.forPreview
											) {
												payload.briefAsset.push(assetDetail);
											} else if (
												['Image', 'PDF', 'Audio', 'Link'].indexOf(assetDetail.displayType) > -1 &&
												assetDetail.forPreview
											) {
												payload.briefAssetPreview.push(assetDetail);
											}

											if (assetDetail.displayType == 'Video' && !assetDetail.forPreview) {
												if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
													this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
												}
												payload.briefAsset.push(assetDetail);
											} else if (assetDetail.displayType == 'Video' && assetDetail.forPreview) {
												if (assetDetail.displayType == 'Video' && assetDetail.isTranscoding) {
													this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(assetDetail.path);
												}
												payload.briefAssetPreview.push(assetDetail);
											}
											// if (assetDetail.displayType == 'Link') {
											// 	payload.asset_details.push(assetDetail);
											// }
										}
									}
								}

								if (payload.description) {
									this.displayTextOrHyperLink(payload.description);
								}

								this.post = payload;
							}

							this.dripDetails = res.data;
							if (res.data.submit) {
								this.allQuesions = res.data.DripUserQuestions;
							} else {
								await this.updateUserPreviseActionInQuetion(res.data.DripUserQuestions);
							}
							if (res.data.submit) {
								setTimeout(() => {
									if (this.templateType == 'Poll') {
										this.selectedDripDetails = {
											campaign_id: res.data.CampaignId,
											drip_camp_Index: res.data.DripCampIndex,
											drip_camp_id: res.data.DripCampId,
											post_id: res.data.PostId,
										};
										this.appService.getSingleDripDataOfCampaign(this.selectedDripDetails).subscribe((res: any) => {
											if (res.success) {
												this.selectedDripAllData = [];
												this.selectedDripAllData = res.data;
												setTimeout(() => {
													this.getDataForPollGraphResult();
												}, 200);
											}
										});
									}
								}, 200);
							}

							// ----------------------Spin The Wheel-------------------
							if (this.templateType == 'Spin The Wheel') {
								this.spinCategoryArray = [];
								this.assignUserSpinCategoryArray = [];
								let asssignSpinQue = JSON.parse(this.dripDetails.assignSpinQue);

								if (asssignSpinQue && asssignSpinQue.length > 0) {
									this.showSpinCategoryQuestion = true;
									for (let question of asssignSpinQue) {
										this.assignUserSpinCategoryArray.push(question);
									}
								}
							}

							let categoryList = [];
							let totalSpinScore = 0;
							let spinCatCount = 0;

							if (this.templateType == 'Spin The Wheel') {
								this.maxSpinCharCount = await this.findMaxQuesCharCount(this.allQuesions);
							}

							if (this.allQuesions.length > 0) {
								for (let question of this.allQuesions) {
									let count = 0;
									let answer = '';
									let que = question;
									question.answerStatus = '';
									let iscorrect = false;
									let iswrong = false;
									question.isSurveyQueNotSelected = false;
									question.mobileError = false;
									question.allowFileFormat = '.jpg, .png';
									question.userRatingArray = [];

									if (question.allowFileTypes == 'PDF') {
										question.allowFileFormat = '.pdf';
									}
									if (question.allowFileTypes == 'Video') {
										question.allowFileFormat = '.mp4';
									}

									if (this.templateType == 'Survey') {
										if (question.questionType == 'Date Time' || question.questionType == 'Date') {
											if (
												question.surveyNote == null ||
												question.surveyNote == '' ||
												question.surveyNote == undefined
											) {
												question.surveyNote = moment().format();
											}
										}
										if (question.questionType == 'Mobile No') {
											this.getAllCountryName();
											if (question.country == null || question.country == '' || question.country == undefined) {
												question.country = this.selectedCountryName ? this.selectedCountryName : 'India';
											}
										}

										if (question.questionType == 'Rating scale') {
											this.ratingScaleArray(question);
										}
									}

									// ----------------------Spin The Wheel-------------------
									if (
										this.templateType == 'Spin The Wheel' &&
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

										if (this.maxSpinCharCount == 15) {
											spinCategoryPayload.textFontSize = 12;
										} else if (this.maxSpinCharCount < 15 && this.maxSpinCharCount > 10) {
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

											this.spinCategoryArray.push(spinCategoryPayload);
											categoryList.push(question.spinCatIndex);
										}

										if (this.isSubmited) {
											for (let spinqueIndex of this.assignUserSpinCategoryArray) {
												if (spinqueIndex == question.spinCatIndex) {
													totalSpinScore = question.spinQueScore;
													this.spinTheQuestionCount = this.spinTheQuestionCount + totalSpinScore;
												}
											}
										}
									}

									for (let option of que.DripUserOptions) {
										option.optVal = 0;
										option.optTotal = 0;
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

										if (iscorrect && !iswrong) {
											question.answerStatus = 'Correct';
										} else if (iscorrect && iswrong && question.questionType == 'MCQ') {
											question.answerStatus = 'Partially Correct';
										} else if (iscorrect && iswrong && question.questionType == 'Drag and Drop') {
											question.answerStatus = 'Incorrect';
										} else if (!iscorrect && iswrong) {
											question.answerStatus = 'Incorrect';
										}

										if (option.correctAns == true) {
											count++;
										}
										if (option.selectedAns) {
											answer = option.text;
										}
										if (
											(this.templateType == 'Poll' && option.selectedAns) ||
											(this.templateType == 'Survey' && option.selectedAns)
										) {
											question.selectedAnswer = option.text;
										}
									}
									if (count > 1) {
										question.questionType = 'multiCorrectAns';
									} else if (count == 1) {
										question.selectedAnswer = answer;
									}

									if (this.templateType == 'Survey' && question.multipleOption) {
										question.questionType = 'multiCorrectAns';
									}

									if (question.questionType == 'Drag and Drop' && question.DripUserOptions) {
										if (question.DripUserOptions[0].userSeq == 0 || question.DripUserOptions[0].userSeq == null) {
											let options = question.DripUserOptions.sort(() => Math.random() - 0.5);
											question.DripUserOptions = [];
											question.DripUserOptions = options;
											let count = 1;
											for (let data of options) {
												data.userSeq = count;
												count++;
											}
											this.updateDripLocalData();
										} else {
											let temp = question.DripUserOptions.sort((a, b) => {
												if (a.userSeq < b.userSeq) {
													return -1;
												}
											});
											question.DripUserOptions = temp;
											this.allQuesOptions = [];
											for (let option of question.DripUserOptions) {
												this.allQuesOptions.push(option);
											}
										}
									}
								}
								if (this.templateType == 'Offline Task' || this.templateType == 'Survey') {
									this.checkTrancecoding();
								}

								setTimeout(() => {
									this.addDefaultValues();
								}, 500);
							}

							//to clear previous selection only for spin the wheel
							if (this.templateType == 'Spin The Wheel' && !this.isSubmited && this.spinAPIcounter <= 0) {
								this.clearForm();
								this.spinAPIcounter++;
							}
						}
						this.dismiss();
					} else {
						this.dismiss();
					}
				} catch (error) {
					console.log('getPostByDripCode error.....', error);
					this.dismiss();
				}
			},
			(error: any) => {
				this.dismiss();
			}
		);
	}

	addDefaultValues() {
		if (this.isSubmited === false && this.templateType === 'Survey') {
			//Get User Personal Data
			if (localStorage.getItem('user')) {
				let userData = JSON.parse(localStorage.getItem('user')).user;
				for (let question of this.allQuesions) {
					if (['Short answer', 'Email', 'Mobile No'].indexOf(question.questionType) > -1) {
						if (question.zoomLinkTo === 'First Name') {
							// question.surveyNote = userData.first;
							question.surveyNote = this.appService?.userPersonalData?.first
								? this.appService.userPersonalData.first
								: null;
						} else if (question.zoomLinkTo === 'Last Name') {
							// question.surveyNote = userData.last;
							question.surveyNote = this.appService?.userPersonalData?.last
								? this.appService.userPersonalData.last
								: null;
						} else if (question.zoomLinkTo === 'Email') {
							// question.surveyNote = userData.email;
							question.surveyNote = this.appService?.userPersonalData?.email
								? this.appService.userPersonalData.email
								: null;
						}
						// else if(question.zoomLinkTo === 'Phone'){
						// 	question.surveyNote = userData.phone;
						// }
					}
				}
			}
		}
	}

	onLike() {
		this.post.isLiked = !this.post.isLiked;
		let payload = {};
		if (!this.showSingalPost) {
			payload = {
				isLiked: this.post.isLiked,
				userId: this.userDetails.id,
				id: this.post.id,
			};
		} else {
			payload = {
				isLiked: this.post.isLiked,
				id: this.post.id,
			};
		}
		this.appService.updateLike(this.incomingPostId, payload).subscribe((res: any) => {});
	}

	onBookmark() {
		this.post.isBookmarked = !this.post.isBookmarked;
		let payload = {};
		if (!this.showSingalPost) {
			payload = {
				isBookmarked: this.post.isBookmarked,
				userId: this.userDetails.id,
				id: this.post.id,
			};
		} else {
			payload = {
				isBookmarked: this.post.isBookmarked,
				id: this.post.id,
			};
		}
		this.appService.updateBookmark(this.incomingPostId, payload).subscribe((res: any) => {});
	}

	submitComment() {
		this.commentForm.reset();
	}

	navigateToComments() {
		this.router.navigate(['/comments']);
	}
	async back() {
		if (this.editOfflientTaskNote) {
			this.editOfflientTaskNote = false;
			return;
		} else if (this.showAudioRecording) {
			this.showAudioRecording = false;
			return;
		} else {
			await this.appService.pauseVideo();
			if (this.showSingalPost) {
				this.navCtrl.navigateRoot('login');
			} else {
				this.navCtrl.pop();
			}
		}
	}

	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	submitForm() {
		let flag = true;
		let totalScore = 0;
		let updateOptionIds = [];
		let updateQuestionList = [];
		let assignUserSpinCategoryArray = [];
		let text = null;
		let score = 0.0;
		for (let que of this.allQuesions) {
			let currectAnswer = [];
			let userAnswer = [];
			let count = 1;

			if (
				que.offlineTaskNote ||
				que.surveyNote ||
				que.questionType === 'Date' ||
				que.skipQuestion ||
				que.questionType === 'Geo Tag' ||
				que.questionType === 'Rating scale'
			) {
				if (que.questionType === 'Date') {
					que.surveyNote = moment(que.surveyNote).format('YYYY-MM-DD');
				}

				if (que.questionType === 'Geo Tag') {
					que.geoLocation = que.geoLocation;
					que.latitude = que.latitude;
					que.longitude = que.longitude;
				}

				if (que.questionType === 'Rating scale') {
					que.surveyUserRating = que.surveyUserRating;
				}

				updateQuestionList.push(que);
			}

			if (
				que.questionType === 'MCQ' ||
				que.questionType === 'Drop Down' ||
				que.questionType === 'multiCorrectAns'
				//  ||
				// que.questionType === 'Rating scale'
			) {
				let options = que.DripUserOptions.sort((a, b) => {
					if (a.id < b.id) {
						return -1;
					}
				});

				for (let option of options) {
					if (option.correctAns) {
						currectAnswer.push(count);
					}
					if (option.selectedAns) {
						updateOptionIds.push(option.id);
						userAnswer.push(count);
						if (this.templateType == 'Poll') {
							text = option.text;
						}
					}
					count++;
				}

				let correctAns = false;
				let wrongAns = false;

				for (let option of options) {
					if (option.correctAns == true && option.selectedAns == true) {
						correctAns = true;
					} else if (option.selectedAns || option.correctAns) {
						wrongAns = true;
					}
				}
				// if (currectAnswer.length >= userAnswer.length) {
				// 	for (let currect of currectAnswer) {
				// 		if (userAnswer.indexOf(currect) > -1) {
				// 			correctAns = true;
				// 		} else {
				// 			wrongAns = true;
				// 		}
				// 	}
				// } else if (currectAnswer.length > userAnswer.length) {
				// 	for (let userAns of userAnswer) {
				// 		if (currectAnswer.indexOf(userAns) > -1) {
				// 			correctAns = true;
				// 		} else {
				// 			wrongAns = true;
				// 		}
				// 	}
				// }
				// console.log('--------correctAns------', correctAns);
				// console.log('--------wrongAns------', wrongAns);
				if (this.templateType == 'Spin The Wheel') {
					if (correctAns && wrongAns) {
						score = que.spinQueScore / 2;
						totalScore = totalScore + score;
						// console.log('----totalScore1.1---', totalScore);
					} else if (correctAns && !wrongAns) {
						score = que.spinQueScore;
						// console.log('----score1.2---', score);
						totalScore = totalScore + score;
					}
				} else {
					if (correctAns && wrongAns) {
						totalScore = totalScore + 1;
					} else if (correctAns && !wrongAns) {
						totalScore = totalScore + 2;
					}
				}
			} else if (que.questionType == 'Drag and Drop') {
				let options = que.DripUserOptions.sort((a, b) => {
					if (a.userSeq < b.userSeq) {
						return -1;
					}
				});

				let isCorrectAnswer = true;
				for (let option of que.DripUserOptions) {
					if (option.sr_no != option.userSeq) {
						isCorrectAnswer = false;
					}
				}

				if (this.templateType == 'Spin The Wheel') {
					if (this.assignUserSpinCategoryArray && this.assignUserSpinCategoryArray.length > 0) {
						if (this.assignUserSpinCategoryArray.indexOf(que.spinCatIndex) > -1) {
							for (let option of que.DripUserOptions) {
								if (option.sr_no != option.userSeq) {
									isCorrectAnswer = false;
								}
							}
						} else {
							isCorrectAnswer = false;
						}
					}

					if (isCorrectAnswer) {
						score = que.spinQueScore;
						totalScore = totalScore + score;
						// console.log('----totalScore2---', totalScore);
					}
				} else {
					if (isCorrectAnswer) {
						totalScore = totalScore + 2;
					}
				}
			}
		}

		for (let question of this.allQuesions) {
			let flag_ = false;
			// question.questionType == 'Rating scale' ||
			if (
				this.templateType == 'Poll' ||
				((this.templateType == 'Quiz' ||
					this.templateType == 'Quiz (Randomised)' ||
					(this.templateType == 'Spin The Wheel' && question.spinCatName == this.selectCategoryName)) &&
					question.questionType != 'Drag and Drop') ||
				(this.templateType == 'Survey' &&
					(question.questionType == 'MCQ' ||
						question.questionType === 'Drop Down' ||
						question.questionType == 'multiCorrectAns') &&
					!question.skipQuestion &&
					question.isQuesRequired == true)
			) {
				for (let option of question.DripUserOptions) {
					if (option.selectedAns) {
						flag_ = true;
					}
				}
				if (!flag_) {
					question.isSurveyQueNotSelected = true;
					flag = false;
				}
			}
			//For Drag And Drop
			else if (question.questionType == 'Drag and Drop') {
				let notChangeSequency = false;
				let count = 1;
				for (let option of question.DripUserOptions) {
					if (option.userSeq == 0 && !notChangeSequency) {
						notChangeSequency = true;
						option.userSeq = count;
						count++;
					} else if (notChangeSequency) {
						option.userSeq = count;
						count++;
					}
				}
				this.updateDripLocalData();

				// if (notChangeSequency) {

				// }
				this.appService
					.submitDripSequency(
						{
							options: question.DripUserOptions,
							isDripClickAction: this.isDripClickActionForDrag,
							templateType: this.templateType,
						},
						this.id
					)
					.subscribe((res: any) => {
						// if (res.success) {
						// 	this.isDripClickActionForDrag = true;
						// 	for (let question of this.allQuesions) {
						// 		if (question.id == res.data[0].DripUserQuestionId) {
						// 			question.DripUserOptions = res.data;
						// 			this.allQuesOptions = [];
						// 			for (let option of question.DripUserOptions) {
						// 				this.allQuesOptions.push(option);
						// 			}
						// 		}
						// 	}
						// }
					});
			}

			if (this.templateType == 'Survey' && question.isQuesRequired) {
				if (
					['Short answer', 'Long answer', 'Email', 'Mobile No', 'Date', 'Date Time'].indexOf(question.questionType) >
						-1 &&
					(question.surveyNote == null || question.surveyNote == undefined || question.surveyNote == '') &&
					!question.skipQuestion
				) {
					question.isSurveyQueNotSelected = true;
					flag = false;
				} else if (
					question.questionType == 'Geo Tag' &&
					(question.geoLocation == null || question.geoLocation == undefined || question.geoLocation == '') &&
					!question.skipQuestion
				) {
					question.isSurveyQueNotSelected = true;
					flag = false;
				} else if (
					question.questionType == 'File upload' &&
					question.UserBriefFiles.length == 0 &&
					!question.skipQuestion
				) {
					question.isSurveyQueNotSelected = true;
					flag = false;
				} else if (
					question.questionType == 'Rating scale' &&
					(question.surveyUserRating == null ||
						question.surveyUserRating == undefined ||
						question.surveyUserRating == '') &&
					!question.skipQuestion
				) {
					question.isSurveyQueNotSelected = true;
					flag = false;
				}

				if (question.questionType == 'Mobile No' && question.mobileError) {
					return;
				}

				if (question.questionType == 'Email' && this.emailError) {
					return;
				}
			}

			if (this.templateType == 'Offline Task') {
				if (
					question.questionType == 'Text and File Input' &&
					question.isFileSubmission &&
					question.UserBriefFiles.length == 0 &&
					question.isTextResponse &&
					(question.offlineTaskNote == '' || question.offlineTaskNote == null)
				) {
					this.presentToast(this.appService.getTranslation('Utils.selectbriefassetsAndText'));
					flag = false;
				} else if (
					question.isFileSubmission &&
					question.UserBriefFiles.length == 0 &&
					question.questionType == 'Text and File Input'
				) {
					this.presentToast(this.appService.getTranslation('Utils.selectbriefassets'));
					flag = false;
				} else if (
					question.isTextResponse &&
					(question.offlineTaskNote == '' || question.offlineTaskNote == null) &&
					question.questionType == 'Text and File Input'
				) {
					this.presentToast(this.appService.getTranslation('Utils.briefTextResponse'));
					flag = false;
				} else if (question.questionType == 'Voice Input' && question.UserBriefFiles.length == 0) {
					this.presentToast(this.appService.getTranslation('Utils.submitVoiceResponse'));
					flag = false;
				}
			}
		}

		if (flag) {
			let payload = {
				type: this.templateType,
				PostId: this.dripDetails.PostId,
				totalScore: totalScore,
				UserId: this.dripDetails.UserId,
				CampaignId: this.dripDetails.CampaignId,
				DripCampIndex: this.dripDetails.DripCampIndex,
				isZoomMeeting: this.dripDetails.isZoomMeeting,
				option: text,
				isDripClickAction: this.dripDetails.isDripClickAction,
				updateOptionIds,
				updateQuestionList,
				assignUserSpinCategoryArray,
			};

			if (this.assignUserSpinCategoryArray && this.assignUserSpinCategoryArray.length > 0) {
				payload.assignUserSpinCategoryArray = this.assignUserSpinCategoryArray;
			}

			// console.log('--payload--', payload);
			// return;
			this.appService.submitDripForm(payload, this.id).subscribe((res: any) => {
				if (this.templateType == 'Survey') {
					this.navCtrl.navigateForward(['/thank-you']);
				} else {
					this.presentToast(this.appService.getTranslation('Utils.submitresponse'));
				}
				this.content.scrollToTop(1000);
				this.clearCurrentDripData();

				if (this.userDetails && this.userDetails.id) {
					setTimeout(() => {
						this.getPostByUserId();
					}, 300);
				} else {
					this.isSubmited = true;
					this.score = res.totalScore;
					setTimeout(() => {
						if (this.drip_code) {
							this.getPostByDripCode(this.drip_code);
						} else {
							this.getDripData();
						}
					}, 300);
				}
			});
			this.saveSpinTheWheelAssignQuestion();
		} else {
			return;
		}
	}

	saveSpinTheWheelAssignQuestion() {
		if (this.templateType == 'Spin The Wheel' && this.assignUserSpinCategoryArray.length > 0) {
			this.appService
				.saveDripSpinTheWheelAssignQuestion(this.assignUserSpinCategoryArray, this.id)
				.subscribe((res: any) => {
					this.presentToast(this.appService.getTranslation('Utils.submitanswer'));
					this.content.scrollToTop(1000);
				});
		}
	}

	clearForm() {
		let questionIds = [];
		for (let question of this.allQuesions) {
			questionIds.push(question.id);
		}
		let payload = {
			questionIds: questionIds,
			id: this.dripDetails.id,
			isDripClickAction: this.dripDetails.isDripClickAction,
			type: this.templateType,
		};
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
		}

		this.appService.clearDripForm(payload).subscribe((res: any) => {
			this.clearCurrentDripData();

			if (this.userDetails) {
				this.getPostByUserId();
			} else if (this.drip_code) {
				this.getPostByDripCode(this.drip_code);
			} else {
				this.getDripData();
			}
		});
	}

	checkedOption(i, j, event) {
		this.allQuesions[i].isSurveyQueNotSelected = false;
		// console.log('-this.allQuesions[i].DripUserOptions==MCQ-', this.allQuesions[i].DripUserOptions);
		// if (this.templateType == 'Survey') {
		// for (let option of this.allQuesions[i].DripUserOptions) {
		// if (option.text == event) {
		// 	option.selectedAns = true;
		// } else {
		// 	option.selectedAns = false;
		// }
		// }

		for (let k = 0; k < this.allQuesions[i].DripUserOptions.length; k++) {
			if (k == j) {
				this.allQuesions[i].DripUserOptions[k].selectedAns = true;
			} else {
				this.allQuesions[i].DripUserOptions[k].selectedAns = false;
			}
		}
		// }
		// else {
		// 	for (let option of this.allQuesions[i].DripUserOptions) {
		// 		if (option.text == event.target.value) {
		// 			option.selectedAns = true;
		// 		} else {
		// 			option.selectedAns = false;
		// 		}
		// 	}
		// }

		// console.log('---MCQ--', this.allQuesions[i].DripUserOptions);

		let skipValue;
		let flag = false;
		let type;
		//  || this.allQuesions[i].questionType == 'Rating scale'
		if (this.templateType == 'Survey' && this.allQuesions[i].questionType == 'MCQ') {
			for (let m = 0; m < this.allQuesions.length; m++) {
				if (m == i) {
					for (let k = 0; k < this.allQuesions[i].DripUserOptions.length; k++) {
						if (
							j == k &&
							this.allQuesions[i].DripUserOptions[k].skipQueType !== 'Continue to the next question' &&
							this.allQuesions[i].DripUserOptions[k].skipQueType !== 'Submit Form'
						) {
							type = this.allQuesions[i].DripUserOptions[k].skipQueType;
							skipValue = parseInt(this.allQuesions[i].DripUserOptions[k].skipQueType);
							flag = true;
						} else if (j == k && this.allQuesions[i].DripUserOptions[k].skipQueType == 'Submit Form') {
							type = this.allQuesions[i].DripUserOptions[k].skipQueType;
							skipValue = i;
							flag = true;
						} else {
							flag = true;
						}
					}
				} else if (flag) {
					if (m < skipValue && type !== 'Submit Form') {
						this.allQuesions[m].skipQuestion = true;
					} else if (m > skipValue && type == 'Submit Form') {
						this.allQuesions[m].skipQuestion = true;
					} else {
						this.allQuesions[m].skipQuestion = false;
					}

					if (this.allQuesions[m].skipQuestion) {
						for (let k = 0; k < this.allQuesions[m].DripUserOptions.length; k++) {
							this.allQuesions[m].DripUserOptions[k].selectedAns = false;
						}
					}
				}
			}
		}

		this.updateDripLocalData();
	}

	onSelectDropDownOption(i, event) {
		this.allQuesions[i].isSurveyQueNotSelected = false;
		for (let option of this.allQuesions[i].DripUserOptions) {
			if (option.text == event.target.value) {
				option.selectedAns = true;
			} else {
				option.selectedAns = false;
			}
		}
		this.updateDripLocalData();
	}

	multiCheckedOption(i, id) {
		setTimeout(() => {
			// console.log('-this.allQuesions[i].DripUserOptions==MUlti-', this.allQuesions[i].DripUserOptions);

			this.allQuesions[i].isSurveyQueNotSelected = false;
			for (let option of this.allQuesions[i].DripUserOptions) {
				if (option.id == id) {
					if (option.selectedAns == true) {
						option.selectedAns = false;
					} else if (option.selectedAns == false) {
						option.selectedAns = true;
					}
				}
			}

			// console.log('---MULTI--', this.allQuesions[i].DripUserOptions);
			this.updateDripLocalData();
			// let payload = {
			// 	userAnswer: this.allQuesions[i].DripUserOptions,
			// 	type: this.templateType,
			// 	PostId: this.allQuesions[i].PostId,
			// 	UserId: this.dripDetails.UserId,
			// 	CampaignId: this.dripDetails.CampaignId,
			// 	DripCampIndex: this.dripDetails.DripCampIndex,
			// 	isDripClickAction: this.dripDetails.isDripClickAction,
			// };
			// this.submitQuiz(payload);
		}, 500);
	}

	submitQuiz(payload) {
		this.appService.submitDripUserAns(payload, this.id).subscribe((res: any) => {
			if (res.success) {
			}
		});
	}

	ionSlideDidChange() {
		if (!this.isDripClickAction) {
			this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
				if (res.success) {
					this.isDripClickAction = true;
				}
			});
		}
		let max = 0;
		if (this.post && this.post.asset_details && this.post.asset_details.length > 0) {
			max = this.post.asset_details.length;
		}

		if (this.consumed < this.post.asset_details.length) {
			this.appService.updateDripSwipCount(this.id, this.consumed, max).subscribe((res: any) => {
				if (res.success) {
					this.consumed = res.score;
				}
			});
		}
	}

	onTypeSurveyNote(i) {
		this.allQuesions[i].isSurveyQueNotSelected = false;
	}

	acceptPolicy() {
		this.appService.acceptPolicyByUserWithoutlogin().subscribe((res: any) => {
			if (res.success) {
				this.showCookiePolicyPopUp = false;
			}
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

	downloadAssetFile(assetDetails) {
		if (assetDetails.displayType != 'Link') {
			this.appService
				.downloadAssetByAssetId(assetDetails)
				.toPromise()
				.then(
					(res: any) => {
						let link = document.createElement('a');
						link.href = window.URL.createObjectURL(res);
						link.download = `${assetDetails.name}`;
						link.click();
					},
					(failed) => {
						console.log('Rejected', failed);
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
				});
		} else {
			window.open(`${assetDetails.path}`, '_blank');
		}
	}

	deleteSubmisitFile(file, index, questionIndex) {}

	getVimeoUserIdFromUrl(url) {
		const parts = url.split('/');
		return parts.at(-1);
	}

	async uploadMedia(event: any, data: any, index: any, templateType_: any) {
		this.allQuesions[index].isFileUploadError = false;
		this.allQuesions[index].isSurveyQueNotSelected = false;
		let allowFileTypes = data.allowFileTypes;
		if (!this.isDripClickAction) {
			this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
				if (res.success) {
					this.isDripClickAction = true;
				}
			});
		}
		if (event.target && event.target.files && event.target.files.length > 0) {
			this.selectedMediaAssetDetails = [];

			let flag = true;
			let media = event.target.files[0];
			let fileName = media.name;
			let mediaType = media.type;
			let type = media.type;
			fileName = fileName.replace('.pdf', '').replace('.png', '').replace('.jpg', '').replace('.mp4', '');
			if (mediaType.includes('pdf')) {
				mediaType = 'Document';
				type = 'PDF';
			} else if (mediaType.includes('image')) {
				mediaType = 'Image';
				type = 'Image';
			} else if (mediaType.includes('video')) {
				mediaType = 'Video';
				type = 'Video';
			}
			let payload = {
				title: fileName,
				description: '',
				type: mediaType,
				otherDetails: media,
			};

			const file = media;
			const reader = new FileReader();
			reader.readAsDataURL(file);

			if (mediaType == 'Image' && media.size >= 5242880) {
				if (templateType_ == 'Survey') {
					this.allQuesions[index].isFileUploadError = true;
					this.allQuesions[index].FileUploadErrorMessage = this.appService.getTranslation('Utils.maximage5mb');
				} else {
					this.presentToast(this.appService.getTranslation('Utils.maximage5mb'));
				}
			} else if (mediaType == 'Document' && media.size >= 5242880) {
				if (templateType_ == 'Survey') {
					this.allQuesions[index].isFileUploadError = true;
					this.allQuesions[index].FileUploadErrorMessage = this.appService.getTranslation('Utils.maxpdf5mb');
				} else {
					this.presentToast(this.appService.getTranslation('Utils.maximage5mb'));
				}
			} else {
				if (allowFileTypes == type) {
					if (this.selectedMediaAssetDetails && this.selectedMediaAssetDetails.length == 0) {
						this.selectedMediaAssetDetails.push(payload);
					}
				} else {
					if (allowFileTypes == 'Image') {
						if (templateType_ == 'Survey') {
							this.allQuesions[index].isFileUploadError = true;
							this.allQuesions[index].FileUploadErrorMessage =
								this.appService.getTranslation('Utils.selectImageToUpload');
						} else {
							this.presentToast(this.appService.getTranslation('Utils.selectImageToUpload'));
						}
					} else if (allowFileTypes == 'Video') {
						if (templateType_ == 'Survey') {
							this.allQuesions[index].isFileUploadError = true;
							this.allQuesions[index].FileUploadErrorMessage =
								this.appService.getTranslation('Utils.selectVideoToUpload');
						} else {
							this.presentToast(this.appService.getTranslation('Utils.selectVideoToUpload'));
						}
					} else if (allowFileTypes == 'PDF') {
						if (templateType_ == 'Survey') {
							this.allQuesions[index].isFileUploadError = true;
							this.allQuesions[index].FileUploadErrorMessage =
								this.appService.getTranslation('Utils.selectDocumentToUpload');
						} else {
							this.presentToast(this.appService.getTranslation('Utils.selectDocumentToUpload'));
						}
					}
				}
			}

			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.type == 'Video' && ['Offline Task', 'Survey'].indexOf(templateType_) > -1 && data.UploadOnVimeo) {
					if (this.appService?.configurable_feature?.vimeo) {
						asset.data = null;
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
										asset.size = asset.otherDetails.size;
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
										this.appService
											.uploadLearnerBriefFiles(
												uploadData,
												this.otherDetails.PostId,
												this.otherDetails.CampaignId,
												this.otherDetails.DripCampIndex,
												this.otherDetails.UserId,
												data.id,
												index,
												this.dripDetails.isDripClickAction,
												this.dripDetails.id
											)
											.subscribe((res: any) => {
												this.dismiss();

												if (res.success) {
													this.allQuesions[index].UserBriefFiles = [];
													this.allQuesions[index].UserBriefFiles.push(res.data);
													this.checkTrancecoding();
												}

												//Add Preset URL
												const options = {
													token: this.vimeoDetails.vToken,
													url: 'https://api.vimeo.com/videos',
													presetId: this.vimeoDetails.presetId,
													videoId: asset.vmoVideoId,
												};
												this.appService.applyEmbedPreset(options).subscribe((res: any) => {});
											});
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

						this.appService.uploadVideoOnMediaCMS(uploadData_, this.clientId).subscribe((res: any) => {
							if (res.success) {
								asset.cmsVideoId = res.data.videoId;
								asset.size = res.data.size;
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
								this.appService
									.uploadLearnerBriefFiles(
										uploadData,
										this.otherDetails.PostId,
										this.otherDetails.CampaignId,
										this.otherDetails.DripCampIndex,
										this.otherDetails.UserId,
										data.id,
										index,
										this.dripDetails.isDripClickAction,
										this.dripDetails.id
									)
									.subscribe((res: any) => {
										this.dismiss();

										if (res.success) {
											this.allQuesions[index].UserBriefFiles = [];
											this.allQuesions[index].UserBriefFiles.push(res.data);
											this.checkTrancecoding();
										}
									});
							}
						});
					}
				} else if (['Offline Task', 'Survey'].indexOf(templateType_) > -1) {
					//Need to Upload On S3
					//get Presigned URL
					const parts = media.name.split('.');
					const extension = parts[parts.length - 1];
					const userId = 1000000 + this.userId;
					let fors3FileName =
						userId +
						'_' +
						this.clientId +
						'_' +
						this.appService.generateRandomString(20) +
						'_' +
						Date.now() +
						'.' +
						extension;
					if (asset.type == 'Video') {
						await this.showLoading(this.appService.getTranslation('Utils.vimeovideoloading_2'));
					} else {
						this.showLoading();
					}
					if (this.appService?.configurable_feature?.aws_s3) {
						this.appService.getPresignedUrl(fors3FileName, mediaType).subscribe((res: any) => {
							//upload Video on S3
							this.appService.uploadFileToS3(res.presignedUrl, media).subscribe(async (res: any) => {
								this.appService
									.uploadLearnerBriefFiles(
										null,
										this.otherDetails.PostId,
										this.otherDetails.CampaignId,
										this.otherDetails.DripCampIndex,
										this.otherDetails.UserId,
										data.id,
										index,
										this.dripDetails.isDripClickAction,
										this.dripDetails.id,
										fors3FileName
									)
									.subscribe(
										(res: any) => {
											if (res.success) {
												this.dismiss();
												this.allQuesions[index].UserBriefFiles = [];
												this.allQuesions[index].UserBriefFiles.push(res.data);
											}
										},
										(err) => {
											this.dismiss();
										}
									);
							});
						});
					} else {
						const uploadData = new FormData();
						for (var key in asset) {
							if (key == 'otherDetails') {
								// if (asset.type != 'Video') {
								uploadData.append(asset.type, asset[key]);
								// }
							} else {
								if (key != 'Preview') {
									uploadData.append(key, asset[key]);
								}
							}
						}
						// await this.showLoading();
						this.appService
							.uploadLearnerBriefFiles(
								uploadData,
								this.otherDetails.PostId,
								this.otherDetails.CampaignId,
								this.otherDetails.DripCampIndex,
								this.otherDetails.UserId,
								data.id,
								index,
								this.dripDetails.isDripClickAction,
								this.dripDetails.id
							)
							.subscribe(
								(res: any) => {
									if (res.success) {
										this.dismiss();
										this.allQuesions[index].UserBriefFiles = [];
										this.allQuesions[index].UserBriefFiles.push(res.data);
									}
								},
								(err) => {
									this.dismiss();
								}
							);
					}
				}
				// else {
				// 	const uploadData = new FormData();
				// 	for (var key in asset) {
				// 		if (key == 'otherDetails') {
				// 			// if (asset.type != 'Video') {
				// 			uploadData.append(asset.type, asset[key]);
				// 			// }
				// 		} else {
				// 			if (key != 'Preview') {
				// 				uploadData.append(key, asset[key]);
				// 			}
				// 		}
				// 	}
				// 	if (flag) {
				// 		await this.showLoading();
				// 		flag = false;
				// 	}
				// 	this.appService
				// 		.uploadLearnerBriefFiles(
				// 			uploadData,
				// 			this.otherDetails.PostId,
				// 			this.otherDetails.CampaignId,
				// 			this.otherDetails.DripCampIndex,
				// 			this.otherDetails.UserId,
				// 			data.id,
				// 			index,
				// 			this.dripDetails.isDripClickAction,
				// 			this.dripDetails.id
				// 		)
				// 		.subscribe(
				// 			(res: any) => {
				// 				if (res.success) {
				// 					this.dismiss();
				// 					this.allQuesions[index].UserBriefFiles = [];
				// 					this.allQuesions[index].UserBriefFiles.push(res.data);
				// 				}
				// 			},
				// 			(err) => {
				// 				this.dismiss();
				// 			}
				// 		);
				// }
			}
			this.uploadLearnerFile = null;
			this.learnerFileSubmission.nativeElement.value = '';
		}
	}
	removeUploadedBriefAsset(questionIndex, index) {
		this.allQuesions[questionIndex].UserBriefFiles = [];
		this.appService.removeUploadedBriefAsset(index).subscribe((res: any) => {
			if (res.success) {
			}
		});
	}

	addOfflineTask(index, questionId) {
		if (!this.isSubmited) {
			this.editOfflientTaskNote = true;
			this.editlearnerNoteQuestionIndex = index;
			this.editlearnerNoteQuestionId = questionId;
			this.learnerNote = this.allQuesions[this.editlearnerNoteQuestionIndex].offlineTaskNote;
		}
	}

	addEditSurveyNote(survey, index) {
		if (!this.isSubmited) {
			this.editSurveyNoteIndex = index;
			this.surveyNote = {
				QuestionId: survey.id,
				noteType: survey.questionType,
				surveyNote: survey.surveyNote,
				totalCharLimit: survey.surveyCharLimit,
				characterRemain: survey.surveyCharLimit - (survey && survey.surveyNote ? survey.surveyNote.length : 0),
			};
			// this.showSurveyNote = true;
		}
	}

	checkcharacterlimit(data) {
		this.surveyNote.characterRemain = data.totalCharLimit - (data && data.surveyNote ? data.surveyNote.length : 0);
	}

	cancel() {
		this.editOfflientTaskNote = false;
		this.showSurveyNote = false;
		this.editlearnerNoteQuestionIndex = null;
		this.editSurveyNoteIndex = null;
		this.learnerNote = null;
		setTimeout(() => {
			document.getElementById('question_' + this.editlearnerNoteQuestionId).scrollIntoView({ block: 'center' });
			this.editlearnerNoteQuestionId = null;
		}, 1000);
	}

	saveOfflientTaskNote() {
		// if (!this.isDripClickAction) {
		// 	this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
		// 		if (res.success) {
		// 			this.isDripClickAction = true;
		// 		}
		// 	});
		// }
		this.allQuesions[this.editlearnerNoteQuestionIndex].offlineTaskNote = this.learnerNote;
		this.updateDripLocalData();
		//Need To Update;
		// this.appService
		// 	.updateLearnerNote(this.editlearnerNoteQuestionId, {
		// 		note: this.learnerNote,
		// 		isDripClickAction: this.dripDetails.isDripClickAction,
		// 		AssignedPostToUserId: this.dripDetails.id,
		//		type: this.templateType,
		// 	})
		// 	.subscribe((res: any) => {});
		this.cancel();
	}

	saveSurveyNote() {
		// if (!this.isDripClickAction) {
		// 	this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
		// 		if (res.success) {
		// 			this.isDripClickAction = true;
		// 		}
		// 	});
		// }

		this.allQuesions[this.editSurveyNoteIndex].surveyNote = this.surveyNote.surveyNote;
		this.updateDripLocalData();
		//Need To Update;
		// this.appService
		// 	.updateDripSurveyNote(this.surveyNote.QuestionId, {
		// 		note: this.surveyNote.surveyNote,
		// 		isDripClickAction: this.dripDetails.isDripClickAction,
		// 		AssignedPostToUserId: this.dripDetails.id,
		//		type: this.templateType,
		// 	})
		// 	.subscribe((res: any) => {});
		this.cancel();
	}

	checkTrancecoding() {
		//check Video is present or Not
		if (this.templateType == 'Offline Task' || this.templateType == 'Survey') {
			let checkTransCodeIsPending = false;
			let countOfVideo = 0;
			for (let question of this.allQuesions) {
				for (let uploadedVideo of question.UserBriefFiles) {
					if (
						uploadedVideo.fileType == 'Video' &&
						uploadedVideo.isTranscoding == false
						// &&
						// uploadedVideo.path &&
						// uploadedVideo.path.includes('vimeo.com')
					) {
						checkTransCodeIsPending = true;
						countOfVideo++;
					}
				}
			}
			if (checkTransCodeIsPending) {
				if (this.checkInterval) {
					clearInterval(this.checkInterval);
				}
				let count = 0;
				let completeTranscodingCount = 0;
				this.checkInterval = setInterval(() => {
					for (let question of this.allQuesions) {
						for (let uploadedVideo of question.UserBriefFiles) {
							if (uploadedVideo.fileType == 'Video' && uploadedVideo.isTranscoding == false) {
								const videoId = uploadedVideo.videoId ? uploadedVideo.videoId : uploadedVideo.cmsVideoId;
								this.appService.checkVideoTranscodingStatus(videoId).subscribe((res: any) => {
									if (res.success) {
										if (res.completeTranscoding) {
											uploadedVideo.isTranscoding = true;
											uploadedVideo.path = res.path;
											completeTranscodingCount++;
										}
										if (completeTranscodingCount == countOfVideo) {
											clearInterval(this.checkInterval);
										}
									}
								});
							}
						}
					}

					if (count > 10) {
						clearInterval(this.checkInterval);
					}
					count++;
				}, 15000);
			}
		}
	}

	downloadAssetslink(data) {
		window.open(`${data.path}`, '_blank');
	}

	getDataForPollGraphResult() {
		this.allQuestion = [];
		for (let question of this.selectedDripAllData[0].DripUserQuestions) {
			let options = [];
			for (let option of question.DripUserOptions) {
				options.push({ name: option.text, value: 0, total: 0 });
			}
			this.allQuestion.push({ question: question, type: question.questionType, options: options });
		}
		for (let data of this.selectedDripAllData) {
			for (let question of data.DripUserQuestions) {
				for (let option of question.DripUserOptions) {
					if (option.selectedAns) {
						for (let qua of this.allQuestion) {
							if (qua.question.question == question.question) {
								for (let opt of qua.options) {
									opt.total++;
									if (opt.name == option.text && data.submit) {
										opt.value++;
									}
								}
							}
						}
					}
				}
			}
		}

		for (let question of this.allQuesions) {
			for (let option of question.DripUserOptions) {
				for (let qua of this.allQuestion) {
					for (let opt of qua.options) {
						if (opt.name == option.text) {
							option.optVal = opt.value;
							option.optTotal = opt.total;
						}
					}
				}
			}
		}
	}

	doRefresh(e) {
		this.appService.pauseVideo();

		this.route.queryParams.subscribe((params: any) => {
			if (params && params.dripId) {
				this.incomingPostId = params.dripId;
			}
			if (params && params.drip_code) {
				this.drip_code = params.drip_code;
			}
			if (params && params.showSingalPost) {
				this.showSingalPost = params.showSingalPost;
				if (this.drip_code) {
					localStorage.removeItem('singleDripWithLogin');
					localStorage.removeItem('singleDripWithLoginDripCode');
					this.getPostByDripCode(this.drip_code);
				} else if (this.incomingPostId) {
					if (this.incomingPostId.indexOf('-') > -1) {
						this.incomingPostId = parseInt(this.incomingPostId.split('-')[1]);
					}
					localStorage.removeItem('singleDripWithLogin');
					localStorage.removeItem('singleDripWithLoginDripCode');

					if (this.userDetails) {
						//For Click Link when user is login
						this.getDripDataByUserIdAndDripId();
					} else {
						//For Clink Link when user is not login
						this.getDripData();
					}
				}
			} else {
				if (params && params.id) {
					this.id = params.id;
					this.getPostByUserId();
				}
			}
		});
		e.target.complete();
	}

	drop($event: CdkDragDrop<string[]>, data) {
		moveItemInArray(data, $event.previousIndex, $event.currentIndex);
		let options: any = $event.container.data;

		let count = 1;
		for (let op of options) {
			op.userSeq = count;
			count++;
		}

		options = options.sort((a, b) => {
			if (a.userSeq < b.userSeq) {
				return -1;
			}
		});

		for (let question of this.allQuesions) {
			if (question.id == options[0].DripUserQuestionId) {
				question.DripUserOptions = options;
			}
		}
	}

	goToexternalLink(link, externalLink) {
		if (link) {
			switch (externalLink) {
				case 'externalLink1':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick1) {
						this.post.externalLink.externalLinkClick1 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink2':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick2) {
						this.post.externalLink.externalLinkClick2 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink3':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick3) {
						this.post.externalLink.externalLinkClick3 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink4':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick4) {
						this.post.externalLink.externalLinkClick4 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink5':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick5) {
						this.post.externalLink.externalLinkClick5 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink6':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick6) {
						this.post.externalLink.externalLinkClick6 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink7':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick7) {
						this.post.externalLink.externalLinkClick7 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink8':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick8) {
						this.post.externalLink.externalLinkClick8 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink9':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick9) {
						this.post.externalLink.externalLinkClick9 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				case 'externalLink10':
					if (this.post && this.post.externalLink && !this.post.externalLink.externalLinkClick10) {
						this.post.externalLink.externalLinkClick10 = true;
						this.updateClickExternalLink(this.post.externalLink);
					}
					break;
				default:
					console.error('Invalid external link identifier');
			}
			window.open(`${link}`, '_blank');
		}
	}

	updateClickExternalLink(updatedState) {
		this.appService.updateClickExternalLink(this.id, updatedState).subscribe(
			(res: any) => {
				this.post.clickExternalLink = true;
			},
			(err) => {
				console.error('Error updating external link click:', err);
			}
		);
	}

	gotoHyperLink(url) {
		this.hyperlinkArray.push(url);
		this.appService.updateHyperLink(this.id, this.hyperlinkArray).subscribe(
			(res: any) => {
				// console.log('Successfully updated hyper link click');
			},
			(err) => {
				console.error('Error updating hyper link click:', err);
			}
		);
	}

	formatData(drip) {
		//return drip;
		let dripData = drip;
		if (dripData.DripUserQuestions.length > 0) {
			for (let question of dripData.DripUserQuestions) {
				for (let option of question.DripUserOptions) {
					// if (option?.Asset && option?.Asset?.Asset_details.length > 0) {
					// 	option.Asset.Asset_details[0].displayType = option.Asset.Asset_details[0].displayTy;
					// 	option.Asset.Asset_details[0].isTranscoding = option.Asset.Asset_details[0].isTransco;
					// 	option.Asset.Asset_details[0].vmoVideoId = option.Asset.Asset_details[0].vmoVideoI;
					// }
					if (option.isCorrectAnswer === true || option.isCorrectAnswer === false) {
						option.correctAns = option.isCorrectAnswer;
					}
					if (!option.selectedAns) {
						option.selectedAns = false;
					}
				}
			}
			return dripData;
		} else {
			return dripData;
		}
	}

	updateDripLocalData() {
		let dripIds = localStorage.getItem('dripIds');
		if (dripIds) {
			let flag = false;
			let ids = JSON.parse(dripIds);
			for (let data of ids) {
				if (data.id === this.id) {
					flag = true;
					break;
				}
			}
			if (!flag) {
				ids.push({
					id: this.id,
					date: moment().add(7, 'days').format(),
				});
			}
		} else {
			let ids = [];
			ids.push({
				id: this.id,
				date: moment().add(7, 'days').format(),
			});
			localStorage.setItem('dripIds', JSON.stringify(ids));
		}
		localStorage.setItem(`${this.id}`, JSON.stringify(this.allQuesions));
		if (!this.isDripClickAction) {
			this.appService.updateDripClickAction(this.id).subscribe((res: any) => {
				if (res.success) {
					this.isDripClickAction = true;
				}
			});
		}
	}

	removeDripLocalOldData() {
		let newDripIds = [];
		let dripIds = localStorage.getItem('dripIds');
		if (dripIds) {
			let ids = JSON.parse(dripIds);
			for (let data of ids) {
				if (moment().isBefore(data.date) && data.id !== this.id) {
					localStorage.removeItem(`${data.id}`);
				} else {
					newDripIds.push(data);
				}
			}
			localStorage.setItem('dripIds', JSON.stringify(newDripIds));
		}
	}

	clearCurrentDripData() {
		localStorage.removeItem(`${this.id}`);
		let newDripIds = [];
		let dripIds = localStorage.getItem('dripIds');
		if (dripIds) {
			let ids = JSON.parse(dripIds);
			for (let data of ids) {
				if (data.id !== this.id) {
					newDripIds.push(data);
				}
			}
			localStorage.setItem('dripIds', JSON.stringify(newDripIds));
		}
	}

	updateUserPreviseActionInQuetion(quetion) {
		let preveseData = localStorage.getItem(`${this.id}`);
		if (this.dripDetails.Post.tempType === 'Quiz (Randomised)' || !preveseData) {
			this.allQuesions = quetion;
		} else if (preveseData && this.dripDetails.isDripClickAction) {
			let oldQuesion = JSON.parse(preveseData);
			this.allQuesions = quetion;
			for (let data of this.allQuesions) {
				for (let item of oldQuesion) {
					if (item.id === data.DripQuationId || item.id === data.id) {
						data.surveyNote = item.surveyNote === undefined ? null : item.surveyNote;
						data.offlineTaskNote = item.offlineTaskNote === undefined ? null : item.offlineTaskNote;
						data.surveyUserRating = item.surveyUserRating === undefined ? 0 : item.surveyUserRating;
						for (let option of data.DripUserOptions) {
							for (let optionData of item.DripUserOptions) {
								if (optionData.id === option.DripOptionId || optionData.id === option.id) {
									option.selectedAns = optionData.selectedAns === undefined ? false : optionData.selectedAns;
									option.userSeq = optionData.userSeq === undefined ? 0 : optionData.userSeq;
									break;
								}
							}
						}
						break;
					}
				}
			}
		} else {
			this.allQuesions = quetion;
		}
		return;
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
			} else {
				this.emailError = true;
			}
		} else {
			this.emailError = true;
		}
	}

	getUserLocation(question, index) {
		this.allQuesions[index].isSurveyQueNotSelected = false;
		if (!this.isSubmited) {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						this.getGeocodedLocation(position.coords.latitude, position.coords.longitude, question);
						question.latitude = position.coords.latitude;
						question.longitude = position.coords.longitude;
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
				this.presentToast('Geolocation is not supported by this browser.');
			}
		}
	}

	getGeocodedLocation(latitude: number, longitude: number, question) {
		this.appService.getLocationName(latitude, longitude).subscribe(
			(response: any) => {
				if (response && response.display_name) {
					question.geoLocation = response.display_name;
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

	displayTextOrHyperLink(input) {
		setTimeout(() => {
			const urlPattern = /((http|https):\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
			const contentDiv = document.getElementById('post_description');
			let htmlContent = '';
			let linkIdCounter = 0;
			htmlContent = input.replace(urlPattern, (url) => {
				linkIdCounter++;
				return `<a href="${url}" target="_blank" id="dynamic-hyper-link-${linkIdCounter}">${url}</a>`;
			});

			if (contentDiv) {
				contentDiv.innerHTML = htmlContent;
			}
			setTimeout(() => {
				for (let i = 1; i <= linkIdCounter; i++) {
					const linkElement = document.getElementById(`dynamic-hyper-link-${i}`);
					if (!linkElement) {
						continue;
					}
					linkElement.addEventListener('click', (event) => {
						event.preventDefault();
						const url = linkElement.getAttribute('href');
						// Check if the URL is already in the hyperlink array
						if (!this.hyperlinkArray.includes(url)) {
							this.gotoHyperLink(url);
						}
						window.open(url, '_blank');
					});
				}
			}, 300);
		}, 300);
	}

	//for html template
	addEventListeners() {
		const container = this.elRef.nativeElement.querySelector('.html-container');
		if (container) {
			this.renderer.listen(container, 'click', (event) => {
				const target = event.target as HTMLElement;
				const anchor = target.closest('[data-target]');
				if (anchor) {
					const targetId = anchor.getAttribute('data-target');
					this.showSection(targetId);
				}
			});
		}
	}

	showSection(targetId: string) {
		const container = this.elRef.nativeElement.querySelector('.html-container');
		if (container) {
			const sections = container.querySelectorAll('div[id^="page"]');
			sections.forEach((section) => {
				section.setAttribute('style', 'display: none;');
			});
			const targetSection = container.querySelector(`#${targetId}`);
			if (targetSection) {
				targetSection.setAttribute('style', 'display: block;');
				this.content.scrollToTop(1000);
				this.htmlPageClickCount++;
				// this.testFuntion();
			}
		}
	}

	async nextSlide() {
		await this.slides.slideNext();
	}

	async prevSlide() {
		await this.slides.slidePrev();
	}

	recordingPopUp(data, questionIndex) {
		this.pauseAudio();
		if (!this.isSubmited) {
			this.showAudioRecording = true;
			this.questionIndexForAudioRecording = questionIndex;
			if (data?.UserBriefFiles?.length > 0) {
				//Delete Previous Recording
				this.removeUploadedBriefAsset(questionIndex, data.UserBriefFiles[0].id);
			}
			this.cdr.detectChanges();
			this.startRecording();
			this.isRecording = true;

			this.elapsedSeconds = 0; // Reset timer
			this.updateFormattedTime(); // Ensure it's reset to 00:00

			// Start the timer (increment every 1 second)
			this.timer = setInterval(() => {
				this.elapsedSeconds++;
				this.updateFormattedTime();
			}, 1000);
		}
	}

	updateFormattedTime() {
		// const minutes = Math.floor(this.elapsedSeconds / 60);
		// const seconds = this.elapsedSeconds % 60;
		// // Pad the minutes and seconds with leading zeroes if necessary
		// this.formattedTime = `${this.padTime(minutes)}:${this.padTime(seconds)}`;
		// this.cdr.detectChanges();
	}

	// Helper method to add a leading zero for single digits
	padTime(value: number): string {
		return value < 10 ? `0${value}` : `${value}`;
	}

	submitAudioRecording() {
		this.showAudioRecording = false;
		// console.log('Audio Recording Submitted', this.showAudioRecording);
	}

	// With Voice to text Converter By using AI
	// async submitVoiceRecording(audioBlob?){
	// 	if(audioBlob){

	// 		// Stop the timer
	// 		clearInterval(this.timer);
	// 		this.cdr.detectChanges();
	// 		//Get Question Id , Audio File and Transcript
	// 		let questionId = this.allQuesions[this.questionIndexForAudioRecording].id;
	// 		console.log('Question Id', questionId);
	// 		this.dripDetails.isDripClickAction
	// 		const extension = 'wav';
	// 		const userId = 1000000 + this.userId;
	// 		console.log("--questionIndexForAudioRecording---",this.questionIndexForAudioRecording);
	// 		let fors3FileName = userId + '_' + this.clientId + '_' + this.appService.generateRandomString(20) + '_' + Date.now() + '.' + extension;
	//         await this.showLoading(this.appService.getTranslation('Utils.convertingIntoText'));
	// 		this.appService.getPresignedUrl(fors3FileName, audioBlob.type).subscribe((res: any) => {
	// 					//upload Video on S3
	// 					this.appService.uploadFileToS3(res.presignedUrl, audioBlob).subscribe(async (res: any) => {
	// 						const uploadData = new FormData();
	// 						uploadData.append('Audio', audioBlob, 'audio_file_' + Date.now() + '.' + extension);
	// 						this.appService
	// 							.uploadLearnerBriefFiles(
	// 								uploadData,
	// 								this.otherDetails.PostId,
	// 								this.otherDetails.CampaignId,
	// 								this.otherDetails.DripCampIndex,
	// 								this.otherDetails.UserId,
	// 								questionId,
	// 								this.questionIndexForAudioRecording,
	// 								this.dripDetails.isDripClickAction,
	// 								this.dripDetails.id,
	// 								fors3FileName,
	// 								'Voice Input'
	// 							)
	// 							.subscribe(
	// 								(res: any) => {
	// 									if (res.success) {
	// 										// setTimeout(() => {
	// 											this.allQuesions[this.questionIndexForAudioRecording].UserBriefFiles = [];
	// 											this.allQuesions[this.questionIndexForAudioRecording].UserBriefFiles.push(res.data);
	// 										// }, 1000);
	// 										this.cdr.detectChanges();
	// 										this.dismiss();
	// 									}
	// 									this.submitAudioRecording();
	// 								},
	// 								(err) => {
	// 									this.dismiss();
	// 								}
	// 							);
	// 					});
	// 					this.submitAudioRecording();
	// 				});
	// 	}
	// }

	async submitVoiceRecording(audioBlob) {
		if (audioBlob) {
			// Stop the timer
			clearInterval(this.timer);
			this.cdr.detectChanges();
			//Get Question Id , Audio File and Transcript
			let questionId = this.allQuesions[this.questionIndexForAudioRecording].id;
			// console.log('Question Id', questionId);
			this.dripDetails.isDripClickAction;
			const extension = 'wav';
			const userId = 1000000 + this.userId;
			// console.log('--questionIndexForAudioRecording---', this.questionIndexForAudioRecording);
			let fors3FileName =
				userId +
				'_' +
				this.clientId +
				'_' +
				this.appService.generateRandomString(20) +
				'_' +
				Date.now() +
				'.' +
				extension;
			// await this.showLoading(this.appService.getTranslation('Utils.convertingIntoText'));
			this.appService.getPresignedUrl(fors3FileName, audioBlob.type).subscribe((res: any) => {
				//upload Video on S3
				this.appService.uploadFileToS3(res.presignedUrl, audioBlob).subscribe(async (res: any) => {
					const uploadData = new FormData();
					uploadData.append('Audio', audioBlob, 'audio_file_' + Date.now() + '.' + extension);
					this.appService
						.uploadLearnerBriefFiles(
							uploadData,
							this.otherDetails.PostId,
							this.otherDetails.CampaignId,
							this.otherDetails.DripCampIndex,
							this.otherDetails.UserId,
							questionId,
							this.questionIndexForAudioRecording,
							this.dripDetails.isDripClickAction,
							this.dripDetails.id,
							fors3FileName,
							'Voice Input'
						)
						.subscribe(
							(res: any) => {
								if (res.success) {
									// setTimeout(() => {
									this.allQuesions[this.questionIndexForAudioRecording].UserBriefFiles = [];
									this.allQuesions[this.questionIndexForAudioRecording].UserBriefFiles.push(res.data);
									// }, 1000);
									this.cdr.detectChanges();
									this.dismiss();
									if (res.data?.transcript == '' || res.data?.transcript == null) {
										this.showNoSpeechDetected = true;
										this.dismiss();
									} else {
										this.submitAudioRecording();
									}
								}
							},
							(err) => {
								this.dismiss();
							}
						);
				});
				// this.submitAudioRecording();
			});
		}
	}

	playAudio(path) {
		const audio = this.audioPlayerRef.nativeElement;
		this.currentPlyingAudio = path;
		audio.src = path;
		audio.play();
		this.isPlaying = true;

		// Stop playing when the audio ends
		audio.onended = () => {
			this.isPlaying = false;
			this.currentPlyingAudio = null;
			this.cdr.detectChanges();
		};
		this.cdr.detectChanges();
	}

	pauseAudio() {
		// this.currentPlyingAudio = null;
		// if (this.audioPlayerRef) {
		// 	const audio = this.audioPlayerRef.nativeElement;
		// 	audio.pause();
		// }
		// this.isPlaying = false;
		// this.cdr.detectChanges();

		// New Code
		this.currentPlyingAudio = null;
		if (this.audioPlayerRef) {
			const audio = this.audioPlayerRef.nativeElement;
			audio.pause();
		}
		this.isPlaying = false;
		this.cdr.detectChanges();
	}

	cancelRecording() {
		// this.showAudioRecording = false;
		// this.pauseAudio();
		// clearInterval(this.timer);
		// this.elapsedSeconds = 0;
		// this.formattedTime = '00:00';
		// this.isRecording = false;
		// this.stopRecording();
		// this.cdr.detectChanges();

		//New Code
		this.showAudioRecording = false;
		this.pauseAudio();
		this.stopTimer();
		this.isRecording = false;
		this.stopRecording();
		this.cdr.detectChanges();
	}

	// -------Spin The Wheel---------------------------------
	async findMaxQuesCharCount(AllQuestions) {
		let charCount = 0;
		for (let question of AllQuestions) {
			if (question.spinCatName && question.spinCatName.length > charCount) {
				charCount = question.spinCatName.length;
			}
		}
		return charCount;
	}

	setWidthAndHeight() {
		let checkIntervel = setInterval(() => {
			if (this.maincontainer && this.maincontainer.nativeElement && this.maincontainer.nativeElement.offsetWidth != 0) {
				let percentage = 0.1 * this.maincontainer.nativeElement.offsetWidth;
				this.screenWidth = this.maincontainer.nativeElement.offsetWidth + percentage;
				this.screenHeight = this.maincontainer.nativeElement.offsetWidth;
				this.showSpinWheel = true;
				this.isdesktopView = false;
				clearInterval(checkIntervel);
			}
		}, 10);
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
		// console.log('--idToLandOn--', this.idToLandOn);
		// console.log('--selectCategoryName--', this.selectCategoryName);
	}

	onClickSpinAgain() {
		let flag = true;
		for (let question of this.allQuesions) {
			let flag_ = false;
			if (
				this.templateType == 'Spin The Wheel' &&
				question.spinCatName == this.selectCategoryName &&
				question.questionType != 'Drag and Drop'
			) {
				for (let option of question.DripUserOptions) {
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
					setTimeout(() => {
						this.showSpinCategoryQuestion = false;
					}, 100);
				}
			}
		}
	}

	//for poll show percentage bar
	getPercentage(selectedCount: number, optTotal: number): any {
		if (optTotal === 0) {
			return '0';
		}
		let percentage = (selectedCount / optTotal) * 100;
		// If decimal part is less than 0.5, round down, otherwise round up
		percentage = percentage % 1 === 0 ? percentage : Math.round(percentage);
		return percentage.toFixed(0); // return as integer without decimals
	}
	//suvrye improvisation
	onDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	onFileDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.uploadLearnerFile = null;
	}

	openSurveyModal() {
		this.isSurveyModalOpen = true;
	}

	closeSurveyModal() {
		this.isSurveyModalOpen = false;
	}

	getAllCountryName() {
		this.appService.getCountry().subscribe((res: any) => {
			this.countryList = res.data;
			for (let i in this.countryList) {
				this.countryList[i].countryCode = this.countryList[i].countryCode.toLowerCase();
			}
			this.filterCountryData = this.countryList;
			this.getIPAddress();
		});
	}

	getIPAddress() {
		this.http.get('https://api.ipify.org/?format=json').subscribe((res: any) => {
			this.ipAddress = res.ip;
			this.getCountryName();
		});
	}

	getCountryName() {
		this.appService.getCountryName(this.ipAddress).subscribe((res: any) => {
			this.selectedCountryName = res.countryName;
			if (this.selectedCountryName) {
				for (let i in this.countryList) {
					if (this.countryList[i].name == this.selectedCountryName) {
						// this.selectedCountry = this.countryList[i].name;
						this.selectedCountryCode = this.countryList[i].countryCode;
						this.selectedCallingCode = this.countryList[i].callingCode;
						break;
					}
				}
			}
		});
	}

	selectcountry(event, index) {
		let name = event.target.value;
		// this.selectedCountry = name;
		if (name) {
			for (let i in this.countryList) {
				if (this.countryList[i].name == name) {
					this.selectedCountryCode = this.countryList[i].countryCode;
					this.selectedCallingCode = this.countryList[i].callingCode;
					break;
				}
			}
		}

		if (index) {
			let phone_ = this.allQuesions[index].surveyNote;
			// phone_ = this.selectedCallingCode + phone_;
			// const phoneDetails = phone(phone_, this.selectedCountryCode);
			// if (!phoneDetails.isValid) {
			// 	this.allQuesions[index].mobileError = true;
			// } else {
			// 	this.allQuesions[index].mobileError = false;
			// }

			phone_ = this.selectedCallingCode + phone_;
			const phoneDetails = phone(phone_, { country: this.selectedCountryCode });

			if (this.selectedCountryCode === 'IN' && phoneDetails.isValid && phoneDetails.phoneNumber.length !== 10) {
				this.allQuesions[index].mobileError = true;
			} else if (!phoneDetails.isValid) {
				this.allQuesions[index].mobileError = true;
			} else {
				this.allQuesions[index].mobileError = false;
			}
		}
	}

	checkPhoneNum($event, index) {
		// let phone_ = $event.target.value;
		// phone_ = this.selectedCallingCode + phone_;
		// console.log('-phone_-', phone_);
		// console.log('-selectedCountryCode-', this.selectedCountryCode);

		// const phoneDetails = phone(phone_, this.selectedCountryCode);
		// console.log('-phoneDetails-', phoneDetails);
		// if (!phoneDetails.isValid) {
		// 	this.allQuesions[i].mobileError = true;
		// } else {
		// 	this.allQuesions[i].mobileError = false;
		// }

		let phone_ = $event.target.value;
		phone_ = this.selectedCallingCode + phone_;
		const phoneDetails = phone(phone_, { country: this.selectedCountryCode });

		if (this.selectedCountryCode === 'IN' && phoneDetails.isValid && phoneDetails.phoneNumber.length !== 10) {
			this.allQuesions[index].mobileError = true;
		} else if (!phoneDetails.isValid) {
			this.allQuesions[index].mobileError = true;
		} else {
			this.allQuesions[index].mobileError = false;
		}
	}

	ratingScaleArray(question) {
		question.userRatingArray = [];
		if (question) {
			for (let i = 1; i <= question.ratingScaleMaxCount; i++) {
				question.userRatingArray.push(i);
			}
		}
	}

	setUserRating(i, value: number) {
		this.allQuesions[i].isSurveyQueNotSelected = false;
		if (!this.isSubmited) {
			this.allQuesions[i].surveyUserRating = value;
			this.updateDripLocalData();
		}
	}

	isRatingFilled(i, j: number): boolean {
		return j < this.allQuesions[i].surveyUserRating;
	}
}
