import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { HostListener, Injectable } from '@angular/core';
import { LoadingController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import mockDataJson from 'src/app/data/data.json';
import { ENV } from 'src/environments/environment';
import { AppConfig } from './app.config';
// import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppService {
	videoLogId: any;
	configurable_feature: any;
	videoTotalTimeDuration: any;
	videoPlayTimeDuration: any;
	videoPlayInPercentage: any;

	currentVimeoPlayingVideo: any;
	currentYoutubePlayingVideo: any;
	currentMediaCMSPlayingVideo: any;
	youtubeVideoCheckTimeIntervel: any = 0;
	userPersonalData = {
		account_id: null,
		email: null,
		first: null,
		last: null,
		phone: null,
	};
	deviceType: string = 'Unknown';
	osType: string = 'Unknown';

	showLoaderflag: boolean = false;
	loading: any;
	token: any;
	allDripReloadPage = false;
	type: string = null;

	vimeoObsShare: Observable<string>;
	vimeoResult: string;
	private vimeoLink = new BehaviorSubject('');    
    
	// scorm varibles used in other component
	moduleId!: number;
	learnerId!: number;	
	sessionUserID!: number;	
	initialLaunchDate!: Date | string;
	recentLaunchDate!: Date | string;

	vimeoLinkObs = this.vimeoLink.asObservable();
	sessionStatusInterval = null;
	apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json`;
	isdesktopView: boolean = true;
	isTabletLandscapeView: boolean = false;
	isTabletPortraitView: boolean = false;
	isTablet: boolean = false;
	isMobile: boolean = false;
	isMobileLandscapeView: boolean = false;
	isMobilePortraitView: boolean = false;

	allIconData = null;
	whiteBrandingColor: any = null;

	loginPWALogo: any;
	loginBackgroundImage: any;
	loginPWAText: any;
	defaultPWALogo: any;

	imageBaseURL = ENV.imageHost + ENV.imagePath;
	webAccent_color = null;
	worksheetVideoStatus = null;

	constructor(
		private http: HttpClient,
		private config: AppConfig,
		public loadingCtrl: LoadingController,
		public translate: TranslateService,
		// private cookieService: CookieService,
		public platform: Platform,
		private sanitizer: DomSanitizer
	) {
		//For Staging and Production

		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(ENV.dripHostPlacholder)) {
			this.type = 'drip';
		} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
			this.type = 'diwo';
		}

		//For Staging and Production
		if (this.type) {
			this.setSiteBranding(this.type);
		}

		this.getScreenViewMode();

		this.getAllSVGIconData().subscribe((data) => {
			this.allIconData = data[0];
		});

		if (!this.type) {
			setTimeout(() => {
				this.type = localStorage.getItem('projectName');
				this.setSiteBranding(this.type);
			}, 1000);
		}

		console.log('----------Type---', this.type);

		this.getconfigurableFeature().subscribe((res: any) => {
			if (res.success) {
				this.configurable_feature = res.data;
			}
		});

		this.setUserPersonalData();
	}

	async setSiteBranding(projectType = null) {
		// console.log('-projectType---', projectType);
		//for staging and prodction
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(ENV.dripHostPlacholder)) {
			projectType = 'drip';
		} else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
			projectType = 'diwo';
		}
		//for dev
		if (projectType == null) {
			projectType = localStorage.getItem('projectName');
		}

		let data = await this.getSiteBranding();
		// console.log('-data-', data);
		// console.log('-site Branding projectType---', projectType);

		if (!data) {
			// console.error('----No branding data -----');
			return;
		}

		if (projectType == 'drip') {
			if (
				!data.dripPWA_LoginImagePath ||
				!data.dripPWA_LoginLogoPath ||
				!data.dripPwa_LogoPath ||
				!data.drip_accent_color
			) {
				console.error('-----Missing branding data for drip project---------');
				return;
			}
			// this.loginBackgroundImage = this.sanitizer.bypassSecurityTrustStyle(
			// 	`url(${this.imageBaseURL + data.dripPWA_LoginImagePath})`
			// );
			this.loginBackgroundImage = this.imageBaseURL + data.dripPWA_LoginImagePath;
			let dripURL = this.imageBaseURL + data.dripPWA_LoginLogoPath;
			this.loginPWALogo = this.sanitizer.bypassSecurityTrustResourceUrl(dripURL);
			let dripDefaultURL = this.imageBaseURL + data.dripPwa_LogoPath;
			this.defaultPWALogo = this.sanitizer.bypassSecurityTrustResourceUrl(dripDefaultURL);
			this.loginPWAText = data.dripPWA_Login_Text;
			this.webAccent_color = data.drip_accent_color;
		} else if (projectType == 'diwo') {
			if (
				!data.diwoPWA_LoginImagePath ||
				!data.diwoPWA_LoginLogoPath ||
				!data.diwoPwa_LogoPath ||
				!data.diwo_accent_color
			) {
				console.error('--------Missing branding data for diwo project------------');
				return;
			}
			// this.loginBackgroundImage = this.sanitizer.bypassSecurityTrustStyle(
			// 	`url(${this.imageBaseURL + data.diwoPWA_LoginImagePath})`
			// );
			this.loginBackgroundImage = this.imageBaseURL + data.diwoPWA_LoginImagePath;
			let diwoURL = this.imageBaseURL + data.diwoPWA_LoginLogoPath;
			this.loginPWALogo = this.sanitizer.bypassSecurityTrustResourceUrl(diwoURL);
			let diwoDefaultURL = this.imageBaseURL + data.diwoPwa_LogoPath;
			this.defaultPWALogo = this.sanitizer.bypassSecurityTrustResourceUrl(diwoDefaultURL);
			this.loginPWAText = data.diwoPWA_Login_Text;
			this.webAccent_color = data.diwo_accent_color;
		}
	}

	getSiteBranding() {
		if (!localStorage.getItem('loginAppBrading')) {
			this.getLoginAppBrading().subscribe((res: any) => {
				if (res.success) {
					localStorage.setItem('loginAppBrading', JSON.stringify(res.data));
					return res.data;
				}
			});
		} else {
			let data = JSON.parse(localStorage.getItem('loginAppBrading'));
			return data;
		}
	}

	getScreenViewMode() {
		setTimeout(() => {
			if (this.platform.is('desktop')) {
				this.isdesktopView = true;
			} else {
				this.isdesktopView = false;
			}

			if (this.platform.is('tablet') && window.innerWidth > window.innerHeight) {
				this.isTabletLandscapeView = true;
			} else {
				this.isTabletLandscapeView = false;
			}

			if (this.platform.is('tablet')) {
				this.isTablet = true;
			} else if (this.platform.is('mobile') && window.innerWidth < 767) {
				this.isMobile = true;
			} else {
				this.isdesktopView = true;
			}

			if (this.isTablet && !this.isTabletLandscapeView) {
				this.isTabletPortraitView = true;
			}

			// ? Add Mobile Portrait and Mobile Landscape Logic
			if (this.isMobile && window.innerWidth > window.innerHeight) {
				this.isMobileLandscapeView = true;
				this.isMobilePortraitView = false;
			} else if (this.isMobile) {
				this.isMobilePortraitView = true;
				this.isMobileLandscapeView = false;
			}

			// console.log('---------->> this.isdesktopView <<---', this.isdesktopView);
			// console.log('---------->> isTabletLandscapeView <<----', this.isTabletLandscapeView);
			// console.log('---->> this.isMobile <<--', this.isMobile);
			// console.log('---->> this.isTablet <<--', this.isTablet);
			// console.log('--->> this.isTabletPortraitView <<--', this.isTabletPortraitView);
			// console.log('--->> this.isMobileLandscapeView <<---', this.isMobileLandscapeView);
			// console.log('-->> this.isMobilePortraitView <<--', this.isMobilePortraitView);
		}, 100);
	}

	async showLoader(time?: any) {
		if (time) {
			if (!this.showLoaderflag) {
				this.showLoaderflag = true;
				this.loading = await this.loadingCtrl.create({
					message: '<img src="assets/Loader/Loader_2.svg">',
					duration: time,
					spinner: null,
					cssClass: 'my-loading-class',
				});
				await this.loading.present();
				setTimeout(() => {
					this.showLoaderflag = false;
				}, time);
			}
		} else {
			if (this.showLoaderflag) {
				this.loading = await this.loadingCtrl.create({
					message: '<img src="assets/Loader/Loader_2.svg">',
					duration: 5000,
					spinner: null,
					cssClass: 'my-loading-class',
				});
				await this.loading.present();
			} else {
				this.loading = await this.loadingCtrl.create({
					message: '<img src="assets/Loader/Loader_2.svg">',
					backdropDismiss: false,
					spinner: null,
					cssClass: 'my-loading-class',
				});
				await this.loading.present();
			}
		}

		return;
	}

	hideLoader() {
		// console.log('-this.loading hide-', this.loading);
		if (this.loading) {
			this.loading.dismiss();
		}
	}

	generateRandomString(length) {
		const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charset.length);
			result += charset[randomIndex];
		}
		return result;
	}

	pauseVideo(forceFullyPause = false, update?: boolean, videoType?: any) {
		if (forceFullyPause) {
			if (this.currentVimeoPlayingVideo) {
				this.currentVimeoPlayingVideo.pause();
				return;
			}
			if (this.currentYoutubePlayingVideo) {
				this.currentYoutubePlayingVideo.pauseVideo();
				return;
			}
			if (this.currentMediaCMSPlayingVideo && this.currentMediaCMSPlayingVideo.nativeElement) {
				this.currentMediaCMSPlayingVideo.nativeElement.pause();
				return;
			}
		}

		// console.log('-------forceFullyPause-------', forceFullyPause);
		// console.log('-------update-------', update);
		// console.log('-------videoType-------', videoType);

		// console.log('-------currentVimeoPlayingVideo-------', this.currentVimeoPlayingVideo);
		// console.log('-------videoLogId-------', this.videoLogId);

		if (
			(this.currentVimeoPlayingVideo || this.currentYoutubePlayingVideo || this.currentMediaCMSPlayingVideo) &&
			this.videoLogId &&
			update
		) {
			//Call Update Time API
			console.log('-------pauseVideo-------');
			let payload;
			if (this.type == 'drip') {
				payload = {
					consumed: this.videoPlayTimeDuration,
					percent: this.videoPlayInPercentage,
					max: this.videoTotalTimeDuration,
				};
			} else if (this.type == 'diwo') {
				payload = {
					seconds: this.videoPlayTimeDuration,
					percent: this.videoPlayInPercentage,
					duration: this.videoTotalTimeDuration,
				};
			}

			// console.log('-videoType-', videoType);
			// console.log('-payload-', payload);

			let client_percentage;
			if (videoType == 'Session_Question_Asset') {
				this.updateDiwoQuestionVideoWatchIngLog(payload).subscribe((res: any) => {});
			} else {
				if (localStorage.getItem('user_client')) {
					client_percentage = JSON.parse(localStorage.getItem('user_client'))?.percentage
						? JSON.parse(localStorage.getItem('user_client'))?.percentage
						: 0;
				}
				this.updateVideoWatchIngLog(payload, client_percentage).subscribe((res: any) => {});
			}

			if (this.type == 'diwo') {
				let data = JSON.parse(localStorage.getItem(this.videoLogId));

				let playedPercent = this.videoPlayInPercentage * 100;

				if (data && data.percent < Number(playedPercent)) {
					data.percent = Number(playedPercent) ? Number(playedPercent) : 0;
					data.seconds = this.videoPlayTimeDuration;

					if (data && data.percent >= client_percentage) {
						data.worksheetStatus = 'Completed';
					}

					localStorage.setItem(this.videoLogId, JSON.stringify(data));
				}
			}
		}

		if (this.currentVimeoPlayingVideo) {
			this.currentVimeoPlayingVideo.pause();
			this.currentVimeoPlayingVideo = null;
		}
		if (this.currentYoutubePlayingVideo) {
			this.currentYoutubePlayingVideo.pauseVideo();
			this.currentYoutubePlayingVideo = null;
		}
		if (this.currentMediaCMSPlayingVideo && this.currentMediaCMSPlayingVideo.nativeElement) {
			this.currentMediaCMSPlayingVideo.nativeElement.pause();
			this.currentMediaCMSPlayingVideo = null;
		}

		this.videoLogId = null;

		if (this.youtubeVideoCheckTimeIntervel) {
			clearInterval(this.youtubeVideoCheckTimeIntervel);
			this.youtubeVideoCheckTimeIntervel = 0;
		}
		return;
	}

	generateCookieURL() {
		if (localStorage.getItem('user')) {
			let user = JSON.parse(localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')).user : null;
			if (user) {
				const payload = {
					UserId: user.id,
					first: user.first,
					last: user.last,
					phone: user.phone,
					email: user.email,
					date: new Date().toUTCString(),
				};
				return encodeURIComponent(JSON.stringify(payload));
				// return jwt.sign(payload, secretKey);
			} else {
				const payload = {
					date: new Date().toUTCString(),
					random: (Math.random() + 1).toString(36).substring(7),
				};
				return encodeURIComponent(JSON.stringify(payload));
			}
		} else {
			const payload = {
				date: new Date().toUTCString(),
				random: (Math.random() + 1).toString(36).substring(7),
			};
			return encodeURIComponent(JSON.stringify(payload));
		}
	}

	getTranslation(msg) {
		return this.translate.instant(msg);
	}

	setOptions() {
		let headers = new HttpHeaders({
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*', // This header is ignored by browsers
		});

		let options = {
			headers: headers,
			withCredentials: true,
		};
		return options;
	}

	setOptionForNotLoginUser() {
		// let cookie = this.cookieService.get('cookies');
		let options: any;
		options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			}),
		};
		options.withCredentials = true;

		return options;
	}

	// Login APIS

	verifyCookie(userId) {
		return this.http.post(this.config.getHost() + `/${this.type}/verify-cookie/${userId}`, this.setOptions(), {
			withCredentials: true,
		});
	}

	logout(payload) {
		return this.http.post(this.config.getHost() + `/pwa-logout`, payload);
	}

	addCookie() {
		return this.http.post(this.config.getHost() + `/add-unlisted-user-cookie`, this.setOptionForNotLoginUser(), {
			withCredentials: true,
		});
	}

	getMarket(country) {
		return this.http.get(this.config.getHost() + `/markets/country/${country}`);
	}

	getCountryName(ip) {
		return this.http.get<any>(this.config.getHost() + `/get/country-name/${ip}`);
	}

	getCountry() {
		return this.http.get(this.config.getHost() + `/get-all-countries`);
	}

	getOtp(data) {
		return this.http.put(this.config.getHost() + `/${this.type}/pwaotp`, data);
	}

	registerUser(data) {
		return this.http.post(this.config.getHost() + `/register-learners-for-session-code`, data, this.setOptions());
	}

	getSessionDetailsBySessionCode(sessionCode) {
		return this.http.get(this.config.getHost() + `/get-session-by-session-code/${sessionCode}`, this.setOptions());
	}

	checkSessionClosedBySessionCode(sessionCode) {
		return this.http.get(this.config.getHost() + `/check-session-status-by-session-code/${sessionCode}`);
	}

	// getUserAllCustomerRoleData(userId, MarketId) {
	// 	return this.http.get(this.config.getHost() + `/get/customer/roll/${userId}/${MarketId}`);
	// }

	login(otp) {
		return this.http.post(this.config.getHost() + `/${this.type}/pwa-validate/otp`, otp, this.setOptions());
	}

	getToken(payload) {
		return this.http.post(this.config.getHost() + `/${this.type}/pwa-token`, payload, this.setOptions());
	}

	getAppBranding(clientId) {
		return this.http.get(
			this.config.getHost() + `/get-client-app-branding/${clientId}?type=${this.type}`,
			this.setOptions()
		);
	}

	getDripData(dripId) {
		return this.http.post(this.config.getHost() + `/get-one-drip-by-id/${dripId}`, this.setOptionForNotLoginUser(), {
			withCredentials: true,
		});
	}

	getDripDataByUserIdAndDripId(dripId, userId) {
		return this.http.post(
			this.config.getHost() + `/get-one-drip-by-id/${dripId}/${userId}`,
			this.setOptionForNotLoginUser(),
			{ withCredentials: true }
		);
	}

	getDripDataByUId(dripId, id) {
		return this.http.get(this.config.getHost() + `/get-one-drip-by-id-and-user-id/${dripId}/${id}`, this.setOptions());
	}

	getAllDripData() {
		return this.http.get(this.config.getHost() + `/get-all-drip-by-user-id`, this.setOptions());
	}

	getDripDataByDripCode(drip_code) {
		return this.http.get(this.config.getHost() + `/get-one-drip-data-by-usin-drip-code/${drip_code}`);
	}

	getAllDripDataForSearch(data) {
		return this.http.post(this.config.getHost() + `/get-all-drip-by-user-id-for-search`, data, this.setOptions());
	}

	getAllDripDataSearch(val, data) {
		return this.http.post(this.config.getHost() + `/get-all-search-drip-by-user-id/${val}`, data, this.setOptions());
	}

	getAllDripPageData(userId, limit, offset) {
		return this.http.get(
			this.config.getHost() + `/get-all-drip-by-user-id?limit=${limit}&offset=${offset}`,
			this.setOptions()
		);
	}

	updateLike(dripId, payload) {
		return this.http.put(this.config.getHost() + `/update-drip-like/${dripId}`, payload);
	}

	updateBookmark(dripId, payload) {
		return this.http.put(this.config.getHost() + `/update-drip-bookmark/${dripId}`, payload);
	}

	uploadLearnerBriefFiles(
		data,
		postId,
		campaignId,
		campDripIndex,
		userId,
		dripUserQuestionId,
		questionindex,
		isDripClickAction?,
		AssignedPostToUserId?,
		uploadedfileName = null,
		questionType = null
	) {
		return this.http.post(
			this.config.getHost() +
				`/upload-learner-brief-submission?postId=${postId}&campaignId=${campaignId}&campDripIndex=${campDripIndex}&userId=${userId}&dripUserQuestionId=${dripUserQuestionId}&questionindex=${questionindex}&isDripClickAction=${isDripClickAction}&AssignedPostToUserId=${AssignedPostToUserId}&uploadedfileName=${uploadedfileName}&questionType=${questionType}`,
			data
		);
	}

	updateLearnerNote(questionId, payload) {
		return this.http.post(this.config.getHost() + `/update-learner-offline-task-note/${questionId}`, payload);
	}

	updateDripSurveyNote(questionId, payload) {
		return this.http.post(this.config.getHost() + `/update-learner-drip-survey-note/${questionId}`, payload);
	}

	removeUploadedBriefAsset(id) {
		return this.http.delete(this.config.getHost() + `/remove-uploaded-learner-brife-summision-file/${id}`);
	}

	getAllWorkbookList(searchType) {
		return this.http.get(this.config.getHost() + `/get-all-workbook-list?type=${searchType}`, this.setOptions());
	}

	assignSessionWorksheet(code) {
		return this.http.get(this.config.getHost() + `/get-assign-session-worksheet/${code}`, this.setOptions());
	}

	getAllWorkbookListForSearch(data) {
		return this.http.post(this.config.getHost() + `/get-all-workbook-by-user-id-for-search`, data, this.setOptions());
	}

	getAllWorkbookDataSearch(val, data) {
		return this.http.post(
			this.config.getHost() + `/get-search-all-workbook-by-user-id/${val}`,
			data,
			this.setOptions()
		);
	}

	getUsersAllWorksheets(sessionUserId, limit, offset) {
		return this.http.get(
			this.config.getHost() + `/get-all-worksheet-list/${sessionUserId}?limit=${limit}&offset=${offset}`,
			this.setOptions()
		);
	}

	getUsersScormWorkbook(sessionUserId) {
		return this.http.get(
			this.config.getHost() + `/get-all-workbook-list/${sessionUserId}`,
			this.setOptions()			
		);
	}

	uploadZipDiwoAssetBlob(data: any): Observable<ArrayBuffer> {
		return this.http.post(			
			this.config.getHost() + `/scorm/get-zip-content`,
			data,
			{ responseType: 'arraybuffer' },						
		);
	}

	getSessionWorksheetDetails(data) {
		return this.http.post(
			this.config.getHost() + `/get-sessionworksheet-ids-by-using-sessionuserid`,
			data,
			this.setOptions()
		);
	}

	getWorksheetDetails(data) {
		return this.http.post(this.config.getHost() + `/get-worksheet-ids-by-using-workbookid`, data, this.setOptions());
	}	

	getScormWorkbookData(workbookId, sessionUserId) {
		return this.http.get(
			this.config.getHost() + `/get-scorm-data-by-using-workbookid?workbookId=${workbookId}&sessionUserId=${sessionUserId}`,
			this.setOptions()
		);
	}

	saveScormWorkbookData(data){
		return this.http.post(this.config.getHost() + `/create-scorm-data-by-using-workbookid`, data, this.setOptions());
	}

	getUsersAllWorksheetsForPrint(sessionUserId) {
		return this.http.get(
			this.config.getHost() + `/get-all-worksheet-list-for-print/${sessionUserId}`,
			this.setOptions()
		);
	}

	getUsersWorkBookPreview(worbookId) {
		return this.http.get(this.config.getHost() + `/get-workbook-preview-by-id/${worbookId}`);
	}

	updateUserNote(sessionWorksheetId, userNote) {
		return this.http.put(this.config.getHost() + `/update-learner-note/${sessionWorksheetId}`, userNote);
	}

	updateTrainerSurveyUserNote(sessionWorksheetId, userNote) {
		return this.http.put(this.config.getHost() + `/update-learner-note-trainer-survey/${sessionWorksheetId}`, userNote);
	}

	updateUserSurveyNote(sessionWorksheetId, userNote, isRead) {
		return this.http.put(
			this.config.getHost() + `/update-learner-survey-note/${sessionWorksheetId}?isRead=${isRead}`,
			userNote
		);
	}

	updateUserOfflineTaskNote(sessionWorksheetId, userNote, isRead) {
		return this.http.put(
			this.config.getHost() + `/update-learner-offline-task-note/${sessionWorksheetId}?isRead=${isRead}`,
			userNote
		);
	}

	getUserslWorksheetDetails(sessionWorksheetId) {
		return this.http.get(this.config.getHost() + `/get-all-Question-list/${sessionWorksheetId}`, this.setOptions());
	}

	getsessionDetailsForGraph(sessionWorksheetId) {
		return this.http.get(this.config.getHost() + `/get-session-all-detail-for-pwa/${sessionWorksheetId}`);
	}

	getUserslWorksheetDetailsForPreview(WorksheetId) {
		return this.http.get(this.config.getHost() + `/get-worksheet-Question-list/${WorksheetId}`);
	}

	submitUserAns(payload, isRead, sessionWorksheetId) {
		return this.http.put(this.config.getHost() + `/submit-user-answer/${sessionWorksheetId}?isRead=${isRead}`, payload);
	}

	submitTrainerSurveyUserAnswer(payload) {
		return this.http.put(this.config.getHost() + `/submit-traineronly-survey-user-answer`, payload);
	}

	updateUserDiwoFlag(sessionWorksheetId, payload) {
		return this.http.put(this.config.getHost() + `/update-learner-flag/${sessionWorksheetId}`, payload);
	}

	clearForm(wbId) {
		return this.http.get(this.config.getHost() + `/clear-form/${wbId}`);
	}

	submitForm(data, sessionWorksheetId, sessionUserId, isRead) {
		return this.http.put(
			this.config.getHost() + `/submit-form/${sessionWorksheetId}/${sessionUserId}?isRead=${isRead}`,
			data,
			this.setOptions()
		);
	}

	submitTrainerSurveyForm(sessionWorksheetId) {
		return this.http.put(this.config.getHost() + `/submit-form-trainer-survey/${sessionWorksheetId}`, null);
	}

	submitSequency(payload, sessionWorksheetId, isRead) {
		return this.http.put(this.config.getHost() + `/submit-sequency/${sessionWorksheetId}?isRead=${isRead}`, payload);
	}

	saveDiwoSpinTheWheelAssignQuestion(data, sessionWorksheetId) {
		return this.http.put(this.config.getHost() + `/submit-diwo-spin-wheel-assign-question/${sessionWorksheetId}`, data);
	}

	saveDripSpinTheWheelAssignQuestion(data, sessionWorksheetId) {
		return this.http.put(this.config.getHost() + `/submit-drip-spin-wheel-assign-question/${sessionWorksheetId}`, data);
	}

	///////////////Drip Other Type

	submitDripUserAns(payload, dripAssignedId) {
		return this.http.put(this.config.getHost() + `/submit-drip-user-answer/${dripAssignedId}`, payload);
	}

	submitDripSequency(payload, dripAssignedId) {
		return this.http.put(this.config.getHost() + `/submit-drip-sequency/${dripAssignedId}`, payload);
	}

	clearDripForm(data) {
		return this.http.put(this.config.getHost() + `/clear-drip-form`, data, this.setOptions());
	}

	submitDripForm(data, dripAssignedId) {
		return this.http.put(this.config.getHost() + `/submit-drip-form/${dripAssignedId}`, data);
	}

	submitDripAudioFile(data, dripAssignedId) {
		return this.http.put(this.config.getHost() + `/submit-drip-audio-file/${dripAssignedId}`, data);
	}

	updateDripClickAction(dripAssignedId) {
		return this.http.put(this.config.getHost() + `/update-drip-click-action/${dripAssignedId}`, null);
	}

	updateDripSwipCount(dripAssignedId, score, max) {
		return this.http.post(
			this.config.getHost() + `/update-learner-carousel-swip-count/${dripAssignedId}/${score}/${max}`,
			null
		);
	}

	acceptPolicyByUser(clientId, payload) {
		return this.http.put(
			this.config.getHost() + `/${this.type}/accept-policy-by-user/${clientId}`,
			payload,
			this.setOptions()
		);
	}

	acceptWhatsAppOptIn(flag, clientId) {
		return this.http.put(
			this.config.getHost() + `/${this.type}/whatsapp-opt-in-acceptance-by-user/${flag}/${clientId}`,
			null,
			this.setOptions()
		);
	}

	acceptPolicyByUserWithoutlogin() {
		return this.http.put(
			this.config.getHost() + `/${this.type}/add-unlisted-user-cookie-without-login`,
			this.setOptionForNotLoginUser(),
			{ withCredentials: true }
		);
	}

	getUserNotification(limit, offset) {
		return this.http.get(
			this.config.getHost() + `/${this.type}/get-user-bell-notifcation-for-app?limit=${limit}&offset=${offset}`,
			this.setOptions()
		);
	}

	getUserReadNotification() {
		return this.http.put(
			this.config.getHost() + `/${this.type}/read-all-bell-notification-for-app`,
			null,
			this.setOptions()
		);
	}

	uploadLearnerSubmissiond(data, questionId, worksheetId, fors3FileName = null, sessionUserId, isRead) {
		return this.http.post(
			this.config.getHost() +
				`/upload-learner-submission/${questionId}/${worksheetId}/${sessionUserId}?uploadedOnS3FileName=${fors3FileName}&isRead=${isRead}`,
			data
		);
	}

	deleteSubmitedFile(submitedFileId) {
		return this.http.put(this.config.getHost() + `/delete-submitted-file/${submitedFileId}`, null);
	}

	downloadAssetByAssetId(payload) {
		return this.http.post(this.config.getHost() + `/download-file-for-pwa`, payload, { responseType: 'blob' });
	}

	checkUserHaveSessionAccess(sessionUserId, sessionWorksheetId) {
		return this.http.get(
			this.config.getHost() +
				`/check-user-have-access-of-session?sessionUserId=${sessionUserId}&sessionWorksheetId=${sessionWorksheetId}`,
			this.setOptions()
		);
	}

	checkUserIsExistingOrNot(userId) {
		return this.http.get(
			this.config.getHost() + `/${userId}/${this.type}/check-user-is-existing-or-new-for-policy`,
			this.setOptions()
		);
	}

	getVimeoCredintialByUsingCampaignId(CampaignId) {
		return this.http.get(this.config.getHost() + `/${CampaignId}/get-vimeo-token-by-campaign-id?type=drip`);
	}

	checkVideoTranscodingStatus(videoId) {
		return this.http.get(this.config.getHost() + `/${this.type}/check-video-transcoding-status/${videoId}`);
	}

	getSingleDripDataOfCampaign(payload) {
		return this.http.post(this.config.getHost() + `/get-campaign-drip-analytic-data-for-pwa`, payload);
	}

	createVideoWatchIngLog(payload) {
		return this.http.post(this.config.getHost() + `/${this.type}/create-video-watcing-log`, payload);
	}

	updateVideoWatchIngLog(payload, percentage = 0) {
		return this.http.post(
			this.config.getHost() + `/${this.type}/update-video-watcing-log/${this.videoLogId}/${percentage}`,
			payload
		);
	}

	updateDiwoQuestionVideoWatchIngLog(payload) {
		return this.http.post(
			this.config.getHost() + `/${this.type}/update-question-video-watching-log/${this.videoLogId}`,
			payload
		);
	}

	updateClickExternalLink(assignPostToUserId, link) {
		return this.http.post(
			this.config.getHost() + `/${this.type}/update-click-external-link/${assignPostToUserId}`,
			link
		);
	}

	updateHyperLink(assignPostToUserId, link) {
		return this.http.post(this.config.getHost() + `/${this.type}/update-click-hyper-link/${assignPostToUserId}`, link);
	}

	updateCustomPagesViewed(assignPostToUserId, viewPages) {
		return this.http.post(this.config.getHost() + `/update-cust-template-viewed-page/${assignPostToUserId}`, viewPages);
	}

	getDependenceyModuleDetails(SeeesionUserId, payload) {
		return this.http.post(
			this.config.getHost() + `/get-dependency-module-details/${SeeesionUserId}`,
			payload,
			this.setOptions()
		);
	}

	//////////////////////////------------vimeo -----------//////////////////

	updateVimeoLink(val) {
		this.vimeoLink.next(val);
	}

	updateVimeo;

	createVimeo(options, fileSize): Observable<any> {
		// CUSTOM HEADERS FOR A FIRST INIT CALL
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		// CUSTOM INIT BODY
		const initBody = {
			upload: {
				approach: 'tus',
				size: fileSize,
			},
			name: options.videoName,
			description: options.videoDescription,
		};
		if (this.vimeoResult) {
			return new Observable<any>((observer) => {
				observer.next(this.vimeoResult);
				observer.complete();
			});
		} else if (this.vimeoObsShare) {
			return this.vimeoObsShare;
		} else {
			return this.http.post(options.url, initBody, { headers: initHeaders });
		}
	}

	vimeoUpload(url, file: File): Observable<HttpEvent<any>> {
		const headers = new HttpHeaders({
			'Tus-Resumable': '1.0.0',
			'Upload-Offset': '0',
			'Content-Type': 'application/offset+octet-stream',
		});
		const params = new HttpParams();
		const options = {
			params: params,
			reportProgress: true,
			headers: headers,
		};
		const req = new HttpRequest('PATCH', url, file, options);
		return this.http.request(req);
	}

	applyEmbedPreset(options): Observable<any> {
		// CUSTOM HEADERS FOR A FIRST INIT CALL
		const initHeaders = new HttpHeaders({ Authorization: 'bearer ' + options.token });
		initHeaders.append('Content-Type', 'application/json');
		initHeaders.append('Accept', 'application/vnd.vimeo.*+json;version=3.4');
		// CUSTOM INIT BODY

		return this.http.put(`${options.url}/${options.videoId}/presets/${options.presetId}`, null, {
			headers: initHeaders,
		});
	}

	getAppBrandingForSpotRegBySessionCode(sessionCode) {
		return this.http.get(this.config.getHost() + `/get-appbranding-spotreg-by-sesioncode/${sessionCode}`);
	}

	getLocationName(latitude: number, longitude: number) {
		const url = `${this.apiUrl}&lat=${latitude}&lon=${longitude}&addressdetails=1`;
		console.log('url', url);
		return this.http.get(url);
	}

	getPresignedUrl(fileName: string, fileType: string) {
		return this.http.post(this.config.getHost() + `/generate-presigned-url`, { fileName, fileType });
	}

	uploadFileToS3(url: string, file: File) {
		const headers = new HttpHeaders({
			'Content-Type': file.type,
		});

		return this.http.put(url, file, {
			headers: headers,
		});
	}

	getVimeoCredintialByUsingClientId(clientId) {
		return this.http.get(this.config.getHost() + `/get-vimeo-token-by-client-id/${clientId}`, this.setOptions());
	}

	///////////////////////////////////NEW PWA LMS CODE///////////////////////////////////////////////////////////

	getUserAssignPathwayCourseWBookList(limit) {
		return this.http.get(
			this.config.getHost() + `/get-userassign-pathway-course-todos-workbook-list?limit=${limit}`,
			this.setOptions()
		);
	}

	getWorkbooksCoursesPathwaysCertificatesBadgesCount() {
		return this.http.get(
			this.config.getHost() + `/get-workbook-course-pathway-cert-badges-count-list`,
			this.setOptions()
		);
	}

	checkPlannedSessionStatusBySessionId(sessionIds) {
		return this.http.post(
			this.config.getHost() + `/check-planned-session-status-by-sessionId`,
			sessionIds,
			this.setOptions()
		);
	}

	getUserAssignSeeAllBookList() {
		return this.http.get(this.config.getHost() + `/get-userassign-see-all-workbook-list`, this.setOptions());
	}

	getUserAssignSeeAllToDosList() {
		return this.http.get(this.config.getHost() + `/get-userassign-see-all-todos-list`, this.setOptions());
	}

	getUserAssignAllPathwayList() {
		return this.http.get(this.config.getHost() + `/get-userassign-all-pathway-list`, this.setOptions());
	}

	getUserAssignAllCourseList() {
		return this.http.get(this.config.getHost() + `/get-userassign-all-course-list`, this.setOptions());
	}

	getPathwayDetailsById(pathwaId, diwoAssignmentId) {
		return this.http.get(
			this.config.getHost() + `/${pathwaId}/${diwoAssignmentId}/get-pwa-pathway-details-by-id`,
			this.setOptions()
		);
	}

	getCourseDetailsById(courseId, diwoAssignmentId, courseIndex) {
		return this.http.get(
			this.config.getHost() +
				`/${courseId}/${diwoAssignmentId}/get-pwa-course-details-by-id?courseIndex=${courseIndex}`,
			this.setOptions()
		);
	}

	downloadCertificate(learnerAchivmentId) {
		const baseOptions = this.setOptions();
		const options = {
			...baseOptions,
			responseType: 'blob' as 'json',
		};

		return this.http.get(`${this.config.getHost()}/download-learner-certificate/${learnerAchivmentId}`, options);
	}

	getAllLearnerCertificates() {
		return this.http.get(this.config.getHost() + `/get-all-learner-certification`, this.setOptions());
	}

	/////////////////////////////////////////////////Custom ICon/////////////////////////////////////////////

	getAllSVGIconData() {
		return this.http.get(`/assets/all_in_one/icons.json`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	setIconWhiteBranding(iconObject, color = null) {
		setTimeout(async () => {
			if (localStorage.getItem('app_branding') && JSON.parse(localStorage.getItem('app_branding')).accent_color) {
				this.whiteBrandingColor = JSON.parse(localStorage.getItem('app_branding')).accent_color;
			} else {
				this.whiteBrandingColor = this.webAccent_color ? this.webAccent_color : '#6513e1';
				// console.log('-whiteBrandingColor-', this.whiteBrandingColor);
			}

			for (let iconName in iconObject) {
				let name = iconName;
				iconObject[iconName] = await this.changeColorAndApply(name, this.whiteBrandingColor);
			}
			this.setWhiteBrandingColor();
		}, 500);
	}

	setWhiteBrandingColor() {
		document.documentElement.style.setProperty(`--branding-color`, this.whiteBrandingColor);
		return;
	}

	async changeColorAndApply(name, color: any) {
		if (!this.allIconData) {
			this.getAllSVGIconData().subscribe(async (data) => {
				this.allIconData = null;
				this.allIconData = data[0];
				let icon: any = await this.applyWhiteBrandingOnTheSVGIcon(name, color);
				let finalIcon: SafeHtml = await this.sanitizer.bypassSecurityTrustHtml(icon);
				return finalIcon;
			});
		} else {
			let icon: any = await this.applyWhiteBrandingOnTheSVGIcon(name, color);
			let finalIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(icon);
			return finalIcon;
		}
	}

	//Icon App Brancding
	applyWhiteBrandingOnTheSVGIcon(iconName, color) {
		const svgIcons = this.allIconData;
		const svgIcon = svgIcons[iconName];
		if (!svgIcon) {
			console.error(`Icon with name ${iconName} not found`);
			return;
		}
		const coloredSvgIcon = svgIcon.replaceAll('#6513e1', `${color}`);
		return coloredSvgIcon;
	}

	clearSessionStatusInterval() {
		if (this.sessionStatusInterval) {
			clearInterval(this.sessionStatusInterval);
		}
	}

	getLoginAppBrading() {
		return this.http.get(this.config.getHost() + `/get-login-app-branding`);
	}

	getconfigurableFeature() {
		return this.http.get(this.config.getHost() + `/get-configurable-feature`);
	}

	/////////////////////////////////////////LOGIN PASSWORD/////////////////////////////////////////////////

	resetpassword(data) {
		this.token = localStorage.getItem('session_token');
		let options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				// Authorization: 'Bearer ' + this.token,
			}),
		};
		data.type = this.type;
		data.token = this.token;
		localStorage.removeItem('session_token');
		return this.http.post(this.config.getHost() + `/learner-reset-password`, data, options);
	}

	checkResetPasswordTokenValidity() {
		this.token = localStorage.getItem('session_token');
		let options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			}),
		};
		let data = {
			type: this.type,
			token: this.token,
		};
		return this.http.post(this.config.getHost() + `/check-learner-reset-password-token-validity`, data, options);
	}

	uploadVideoOnMediaCMS(data, clientId) {
		let headers = new HttpHeaders({
			'Access-Control-Allow-Origin': '*', // This header is ignored by browsers
		});

		let options = {
			headers: headers,
			withCredentials: true,
			reportProgress: true,
			observe: 'events' as const,
		};
		return this.http.post(this.config.getHost() + `/${clientId}/upload-video-on-mediacms`, data, options);
	}

	forgotpassword(data) {
		data.type = this.type;
		return this.http.post(this.config.getHost() + `/learner-forgot-password`, data, this.setOptions());
	}

	pwaGetLoginOtp(data) {
		data.type = this.type;
		return this.http.post(this.config.getHost() + `/get-pwa-login-otp`, data, this.setOptions());
	}

	newPwaLogin(data) {
		data.type = this.type;
		return this.http.post(this.config.getHost() + `/get-pwa-validate-user`, data, this.setOptions());
	}

	getUserPersonalDetails() {
		return this.http.get(this.config.getHost() + `/get-user-personal-data`, this.setOptions());
	}

	setUserPersonalData() {
		if (localStorage.getItem('user') && !this.userPersonalData.account_id) {
			this.getUserPersonalDetails().subscribe((res: any) => {
				if (res.success) {
					this.userPersonalData = res.data;
				}
			});
		}
	}

	clearUserPersonaldata() {
		this.userPersonalData.account_id = null;
		this.userPersonalData.first = null;
		this.userPersonalData.last = null;
		this.userPersonalData.email = null;
		this.userPersonalData.phone = null;
	}

	removePersonalData(user) {
		if (user?.first) {
			delete user.first;
		}
		if (user?.last) {
			delete user.last;
		}
		if (user?.account_id) {
			delete user.account_id;
		}
		if (user?.email || user?.email == null) {
			delete user.email;
		}
		if (user?.phone || user?.phone == null) {
			delete user.phone;
		}

		return user;
	}

	convertPdfToBase64(payload) {
		return this.http.post(this.config.getHost() + `/convert-pdf-to-base64`, payload, this.setOptions());
	}

	private errorMessageKeyMap: { [message: string]: string } = {
		'Session code is not valid': 'session_code_not_found',
		'Somthing went wrong!!': 'somthing_went_wrong',
		'Submit answer!': 'submit_answer',
		'Clear Form successful': 'clear_form',
		'Submit Form successful': 'submit_form',
		'No country found': 'no_country_found',
		'Sorry! Drip is currently not available in your country': 'not_avilable',
		'One Time Passcode sent to registered Email OR SMS OR WhatsApp': 'otp_sent',
		'Oops! One Time Passcode could not be generated $  please try again': 'otp_generate_fail',
		'One Time Passcode mismatch $  please try again': 'otp_mismatch_error',
		'One Time Passcode could not be validated $  please try again': 'otp_validate_fail',
		'One Time Passcode validated successfully': 'otp_validate_success',
		'Mobile number sign-in is not supported. Please switch to email sign-in': 'mobile_no_login_not_supported',
		'It looks like your account is not yet registered. Please contact your administrator for access.':
			'user_not_registered',
		'Invalid User': 'invalid_user',
		'failed. but One Time Password sent in': 'otp_fail',
		'Sent in Email OR SMS OR WhatsApp': 'sent_in_email',
		'This account is temporarily suspended. Please contact Customer Support.': 'user_not_active',
		'Invalid User. Please sign up.': 'invalid_user_sign_up',
		'Oops! Could not update. Please try again.': 'update_fail',
		'Invalid request': 'invalid_request',
		'Oops! Could not complete the request. Please try again.': 'request_failed',
		'Sorry! You are not authorised to view this content.': 'unauthorised',
		'Session is closed': 'closed_session',
		'Session is not live': 'session_not_live_or_user_not_approved',
		'Invalid session code': 'invalid_session_code',
		'You are already present in this session': 'user_present_in_session',
		'You have no permision to create spot regitsrations': 'no_permission_to_create_spot_regisration',
		'Sorry $  you have not been nominated in this course.': 'sorry_you_have_not_nominated_in_this_course',
		'Password mismatch': 'password_not_match',
		'No Access': 'no_access_account_',
		'Forgot password link sent successfully': 'learner_forgot_password',
		'Password successfully changed': 'admin_reset_password',
		'Lockout flag reset successfully': 'admin_reset_lockout',
		'Token has expired': 'token_expired',
		'Token is valid': 'valid_token',
		'Invalid token': 'invalid_token',
		'Token verification failed': 'token_verification_fail',
		'Token is missing': 'token_missing',
		'Invalid credentials. Please try again.': 'invalid_user_credential',
		'Incorrect Passwords. Please try again.': 'password_mismatch_error',
		'Your account is locked due to multiple failed attempts. You can reset your password.': 'account_locked',
		'Please refresh the page.': 'please_refresh_page',

		'Instructor Led Training': 'instructor_led_training',
		'Video Based Training': 'video_based_training',
		'Web Based Training': 'web_based_training',
		'Work Task': 'work_task',
		'Not Started': 'notstarted',
		'In Progress': 'inprogress',
		Completed: 'completed',
		Certified: 'certified',
		'Learning Content': 'learning_content',
		Discussion: 'discussion',
		Poll: 'poll',
		Quiz: 'quiz',
		'Offline Task': 'offline_task',
		'Spin The Wheel': 'spin_the_wheel',
		'Word Cloud': 'Word_cloud',
		Survey: 'survey',
	};

	GetLanguageKey(value: string): string | null {
		return this.errorMessageKeyMap[value] || null;
	}

	updateAtentGuideFlag(payload) {
		return this.http.post(this.config.getHost() + `/update-attend-guide-flag`, payload, this.setOptions());
	}
}
