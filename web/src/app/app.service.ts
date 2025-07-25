import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable()
export class AppService {
	private cartCount = new BehaviorSubject(0);
	private image = new BehaviorSubject('');
	image$ = this.image.asObservable();
	menuPermissions: any;
	showBakerInMultipleBook: boolean = true;
	checkNotifcation = false;
	//Today Page Option
	today: boolean = true;
	progress: boolean = false;
	favourites: boolean = false;
	prep: boolean = false;
	parenting: boolean = false;
	configurable_feature: any;
	//Setting Page Option
	allPagesFlage = [true, false, false];
	userPersonalData = {
		account_id: null,
		email: null,
		first: null,
		last: null,
		phone: null,
	};
	badgeflag = false;

	apiHostUrl;
	type: string = null;
	httpOptions = {
		headers: new HttpHeaders({
			'Access-Control-Allow-Origin': '**',
		}),
	};

	timeout = 1000;

	//Google Drive
	googleDriveLogin: boolean = false;

	allIconData = null;
	whiteBrandingColor: any = null;

	loginWebLogo: any;
	aboutWebLogo: any;
	aboutWebText: any;
	defaultWebLogo: any;
	imageHost = environment.imageHost + environment.imagePath;
	webAccent_color: any;

	cmsVideoPlayer: any;

	constructor(private http: HttpClient, private translate: TranslateService, private sanitizer: DomSanitizer) {
		/* setting list of available languages */
		translate.addLangs(['en']);
		/* setting default languages */
		translate.setDefaultLang('en');

		const httpOptions = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				Authorization: 'my-auth-token',
			}),
		};

		this.setProjectName();

		//For Staging and Production
		if (this.type) {
			this.setSiteBranding(this.type);
		}

		//For Staging and Production
		// let hostName = window.location.origin.toLowerCase();
		// if (hostName.endsWith(environment.dripHostPlacholder)) {
		// 	this.apiHostUrl = hostName + '/v1';
		// 	this.type = 'drip';
		// } else if (hostName.endsWith(environment.diwoHostPlacholder)) {
		// 	this.apiHostUrl = hostName + '/v1';
		// 	this.type = 'diwo';
		// }

		//For Dev and Local
		// if (!this.apiHostUrl) {
		// 	this.apiHostUrl = environment.apiUrl;
		// }
		// if (!this.type) {
		// 	this.type = localStorage.getItem('projectName');
		// }
		// this.getAllSVGIconData().subscribe((data) => {
		// 	this.allIconData = data[0];
		// });

		//For App Branding
		// if (localStorage.getItem('app_branding')) {
		// 	let color = JSON.parse(localStorage.getItem('app_branding')).accent_color
		// 		? JSON.parse(localStorage.getItem('app_branding')).accent_color
		// 		: '#6513e1';
		// 	this.whiteBrandingColor = color;
		// 	//set White branding to the Pagination
		// 	this.setPaginationWhiteBranding();
		// }
		console.log('----------Type---', this.type);
		this.getAllSVGIconData().subscribe((data) => {
			this.allIconData = data[0];
		});

		if (!this.type) {
			setTimeout(() => {
				this.setProjectName();
				this.setSiteBranding(this.type);
			}, 100);
		}
		this.getconfigurableFeature().subscribe((res: any) => {
			if (res.success) {
				this.configurable_feature = res.data;
			}
		});

		this.setUserPersonalData();
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

	getUserPersonalDetails() {
		return this.http.get(`${this.apiHostUrl}/get-user-personal-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	sanitizeForCSV(value) {
		console.log('------value--', value);
		if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
			return `'${value}`; // Add a single quote to neutralize formulas
		}
		return value;
	}

	async sanitizedData(data) {
		for (let item of data) {
			for (let key in item) {
				item[key] = await this.sanitizeForCSV(item[key]);
			}
		}
		return data;
	}

	setProjectName() {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
			this.type = 'drip';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.apiHostUrl = hostName + '/v1';
			this.type = 'diwo';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
		if (!this.type && localStorage.getItem('projectName')) {
			this.type = localStorage.getItem('projectName');
		}

		if (localStorage.getItem('app_branding')) {
			let color = JSON.parse(localStorage.getItem('app_branding')).accent_color
				? JSON.parse(localStorage.getItem('app_branding')).accent_color
				: '#6513e1';
			this.whiteBrandingColor = color;
			//set White branding to the Pagination
			this.setPaginationWhiteBranding();
		}
		return;
	}

	changePage(pageName) {
		let allPagesName = [
			'profiles',
			'routine',
			'account',
			'offers',
			'buy a program',
			'support',
			'about',
			'review us',
			'privacy policy',
			'terms and conditions',
			'cookie preferences',
			'delete my account',
			'Gifting',
		];
		let indexNumber;
		for (let i = 0; i < 13; i++) {
			if (pageName == allPagesName[i]) {
				indexNumber = i;
			}
		}
		for (let j = 0; j < 13; j++) {
			if (j == indexNumber) {
				this.allPagesFlage[j] = true;
			} else {
				this.allPagesFlage[j] = false;
			}
		}
		this.resetTodayPage();
	}

	resetTodayPage() {
		this.today = true;
		this.progress = false;
		this.favourites = false;
		this.prep = false;
		this.parenting = false;
	}

	getCurrentLang() {
		return this.translate.currentLang;
	}

	/* get translation languages */
	getLangs() {
		return this.translate.getLangs();
	}

	switchLanguage(language: string) {
		this.translate.use(language);
	}

	getTranslation(string) {
		return this.translate.instant(string);
	}

	setCount(value: number) {
		if (value <= 0) {
			this.cartCount.next(0);
		} else {
			this.cartCount.next(value);
		}
	}

	getCount(): Observable<any> {
		return this.cartCount;
	}

	getCurrentCartCount() {
		return this.cartCount.value;
	}

	getMyInfo() {
		return this.http.get(`${this.apiHostUrl}/users/myInfo`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getMarket(country) {
		return this.http.get(`${this.apiHostUrl}/markets/country/${country}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserAllCustomerRoleData(userId, MarketId) {
		return this.http.get(`${this.apiHostUrl}/get/customer/roll/${userId}/${MarketId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateUserRoleDataInUserTable(data) {
		return this.http.post(`${this.apiHostUrl}/update/user/customer/roll/details`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getProductSubType() {
		return this.http.get(`${this.apiHostUrl}/product/sub/type`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getMarkets(page, limit) {
		return this.http.get(`${this.apiHostUrl}/markets?page=` + page + `&limit=` + limit).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getMarketsBySearch(key) {
		return this.http.get(`${this.apiHostUrl}/markets/${key}/filteredSearch`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getMessagesForUser(userId, childId, market) {
		return this.http
			.get(`${this.apiHostUrl}/get/messages/for/user?userId=${userId}&childId=${childId}&market=${market}`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getPendingActionList(userId) {
		return this.http.get(`${this.apiHostUrl}/get/pending/action/list?userId=${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserCookiePreferences(userId) {
		return this.http.get(`${this.apiHostUrl}/get-user-cookie-preferences/${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updatePendingActionList(data) {
		return this.http.post(`${this.apiHostUrl}/update/pending/action/list`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	addPendingActionList(data) {
		return this.http.post(`${this.apiHostUrl}/add/pending/action/list`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDatabases() {
		return this.http.get(`${this.apiHostUrl}/databases`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUsersMarket(country) {
		return this.http.get(`${this.apiHostUrl}/users/market/${country}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getPopUpNotifications(userId, childId, packageId, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/web/popupNotifications/all?userId=${userId}&childId=${childId}&packageId=${packageId}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
		return null;
	}

	getcancelPackageList(page, limit, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/canceledPackage?page=${page}&limit=${limit}&fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getcancelPackageListBySearch(key, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/canceledPackage/${key}/filteredSearch?fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getcancelPackageFile(startDate, endDate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/canceledPackage/exportToExcelFile?fromdate=${startDate}&todate=${endDate}&market=${market}`,
				{ responseType: 'blob' }
			)
			.pipe();
	}

	getSalesReport(page, limit, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/salesReport?page=${page}&limit=${limit}&fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getGiftingUserReport(page, limit, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/gifting-user-report?page=${page}&limit=${limit}&fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getSalesReportBySearch(key, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/salesReport/${key}/filteredSearch?fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getGiftingUserReportBySearch(key, fromdate, todate, market) {
		return this.http
			.get(
				`${this.apiHostUrl}/gifting-user-report/${key}/filteredSearch?fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getSalesReportFile(startDate, endDate, market) {
		return this.http
			.get(`${this.apiHostUrl}/salesReportExport?fromdate=${startDate}&todate=${endDate}&market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	getGiftingUserReportFile(startDate, endDate, market) {
		return this.http
			.get(`${this.apiHostUrl}/gifting-user-report-export?fromdate=${startDate}&todate=${endDate}&market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	getExpiredPackagesFile(startDate, endDate, market) {
		return this.http
			.get(`${this.apiHostUrl}/expiryReportExport?fromdate=${startDate}&todate=${endDate}&market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	getInAppPurchaseDetalisExport(market) {
		return this.http.get(`${this.apiHostUrl}/in-app-purchase-export?market=${market}`, { responseType: 'blob' }).pipe();
	}

	getProgressReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/users/progress/exportToExcelFile?market=${market}`, { responseType: 'blob' })
			.pipe();
	}

	getMessingConentFile() {
		return this.http.get(`${this.apiHostUrl}/check/messing/content`, { responseType: 'blob' }).pipe();
	}

	getFeedbackReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/users/feedback/exportToExcelFile?market=${market}`, { responseType: 'blob' })
			.pipe();
	}
	getPlacementReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/users/placements/exportToExcelFile?market=${market}`, { responseType: 'blob' })
			.pipe();
	}

	getRankAndProgressReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/users/rank/progress/exportToExcelFile?market=${market}`, { responseType: 'blob' })
			.pipe();
	}

	getChildDetailsReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/get/child/details/exportToExcelFile?market=${market}`, { responseType: 'blob' })
			.pipe();
	}

	getastActivityDetailsReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/get/child/last/activity/details/exportToExcelFile?market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	getFavouritesActivityDetailsReportFile(market) {
		return this.http
			.get(`${this.apiHostUrl}/get/child/Favourites/activity/details/exportToExcelFile?market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	getAppVersionUpdateReport(market) {
		return this.http
			.get(`${this.apiHostUrl}/download-report/getAppVersionUpdateReport?market=${market}`, { responseType: 'blob' })
			.pipe();
	}

	getCommisionReport(page, limit, fromdate, todate, market) {
		//market changes
		return this.http
			.get(
				`${this.apiHostUrl}/commisionReport?page=${page}&limit=${limit}&fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getCommisionReportBysearch(key, fromdate, todate, market) {
		//market changes
		return this.http
			.get(
				`${this.apiHostUrl}/commisionReport/${key}/filteredSearch?fromdate=${fromdate}&todate=${todate}&market=${market}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getCommisionReportFile(startDate, endDate, market) {
		//market changes
		return this.http
			.get(`${this.apiHostUrl}/commisionReportExport?fromdate=${startDate}&todate=${endDate}&market=${market}`, {
				responseType: 'blob',
			})
			.pipe();
	}

	/* get available languages */
	getLanguages() {
		return this.http.get(`${this.apiHostUrl}/languages`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getContentLanguages() {
		return this.http.get(`${this.apiHostUrl}/content/languages`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getHowToVideoByLanguage(language) {
		return this.http.get(`${this.apiHostUrl}/videos/howto/${language}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getHowToOneVideoByLanguage(language, videoType) {
		return this.http.get(`${this.apiHostUrl}/videos/howto/${language}/${videoType}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSpecializations(type) {
		return this.http.get(`${this.apiHostUrl}/specializations/${type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCurrencies() {
		return this.http.get(`${this.apiHostUrl}/currencies`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCountries() {
		return this.http.get(`${this.apiHostUrl}/get-all-countries`).pipe(
			map((data) => {
				return data;
			})
		);
	}
	getBlogById(id) {
		return this.http.get(`${this.apiHostUrl}/blogs/${id}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getLateralQuestionContents() {
		return this.http.get(`${this.apiHostUrl}/lateralContents`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getBuyCartsItemByUserId(userId, status) {
		return this.http.get(`${this.apiHostUrl}/users/` + userId + `/packages?status=` + status).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserRewards(userId, date) {
		return this.http.get(`${this.apiHostUrl}/users/` + userId + `/rewards?date=${date}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getBabyList() {
		return this.http.get(`${this.apiHostUrl}/test/activity/listChild`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getHistoryForContentTest(childId) {
		return this.http.get(`${this.apiHostUrl}/test/activity/history/${childId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getTestActivity(childId, date, toComplete, toRequest, fileRequest, Nonroutine, showCard_display, skipActivityies) {
		return this.http
			.get(
				`${this.apiHostUrl}/test/activity/${childId}/${date}?markCompleted=${toComplete}&noActivities=${toRequest}&fileRequest=${fileRequest}&requestNonroutine=${Nonroutine}&showCard_display=${showCard_display}&skipActivityies=${skipActivityies}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	uploadConfigExcel(childId, data) {
		return this.http.put(`${this.apiHostUrl}/test/activity/history/${childId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateCustoms(childId, data) {
		return this.http.put(`${this.apiHostUrl}/test/activity/customs/${childId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createBabies(data) {
		return this.http.post(`${this.apiHostUrl}/test/child`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getAllPathFileName(data) {
		return this.http.post(`${this.apiHostUrl}/get/all/content/file/name`, data, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateAllCountryIpAddress(data) {
		return this.http.post(`${this.apiHostUrl}/update/all-country-ip-address`, data, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createCoupon(data, referralId) {
		return this.http.post(`${this.apiHostUrl}/referral/${referralId}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}
	automationTesting(data) {
		return this.http.post(`${this.apiHostUrl}/content/automation/testing`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	contentAutomationTesting2(data) {
		return this.http.post(`${this.apiHostUrl}/content/automation/testing/check`, data, { responseType: 'blob' }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	triggerMail(data) {
		return this.http.post(`${this.apiHostUrl}/test/child/triggermail`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteBaby(childId) {
		return this.http.delete(`${this.apiHostUrl}/test/child/${childId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteAllBaby() {
		return this.http.delete(`${this.apiHostUrl}/test/child/all`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	updateShowCardDisplaySetting(childId, lastDate, data) {
		return this.http.post(`${this.apiHostUrl}/test/child/${childId}/preference?lastDate=${lastDate}`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserMenu(role) {
		role = role.replace(/\b\w/g, function (m) {
			return m.toUpperCase();
		});
		return this.http.get(`${this.apiHostUrl}/users/menu/` + role).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getBlogsById(id) {
		return this.http.get(`${this.apiHostUrl}/blogs/` + id).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getRoomList() {
		return this.http.get(`${this.apiHostUrl}/demo/listRooms`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	joinRoom(roomName, time) {
		return this.http.get(`${this.apiHostUrl}/demo/rooms/${roomName}?time=` + time).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getDemoFiles() {
		return this.http.get(`${this.apiHostUrl}/demo/listFiles`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	createRoom(data) {
		return this.http.post(`${this.apiHostUrl}/demo/createRoom`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteDemoRoom(roomName, time) {
		return this.http.delete(`${this.apiHostUrl}/demo/deleteRoom/${roomName}?time=${time}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	bookUserforDemo(data) {
		return this.http.post(`${this.apiHostUrl}/counselling/demo`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadCounsellingRequest() {
		return this.http.get(`${this.apiHostUrl}/counselling/export`, { responseType: 'blob' }).pipe();
	}

	notifyToAll(templateId) {
		return this.http.get(`${this.apiHostUrl}/users/notify/sendAll?template=${templateId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadExcelReport(activityList) {
		return this.http.post(`${this.apiHostUrl}/exportToExcelFileReport`, activityList, { responseType: 'blob' }).pipe();
	}

	validateUrl(url) {
		let data = {
			url: url,
		};
		return this.http.post(`${this.apiHostUrl}/urlValidation`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getActivityData(lang) {
		return this.http.get(`${this.apiHostUrl}/get/Activity/Data/${lang}`, { responseType: 'blob' }).pipe();
	}

	getAllMarket() {
		return this.http.get(`${this.apiHostUrl}/allMarket`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getCountryShowCard(data) {
		return this.http.post(`${this.apiHostUrl}/get-country-show-card`, data).pipe(map((res) => res));
	}

	updateCountryShowCard(data) {
		return this.http.post(`${this.apiHostUrl}/update-country-show-card`, data).pipe(map((res) => res));
	}

	updateCountryMaterialBox(data) {
		return this.http.post(`${this.apiHostUrl}/update-country-material-box`, data).pipe(map((res) => res));
	}

	updatePricingPageFormat(data) {
		return this.http.post(`${this.apiHostUrl}/update-pricing-page-format`, data).pipe(map((res) => res));
	}

	getProductsByMarketId(marketId) {
		return this.http.get<any>(`${this.apiHostUrl}/products/market/` + marketId).pipe(map((data) => data));
	}

	getProductsByUserId(userId) {
		return this.http.get<any>(`${this.apiHostUrl}/user/` + userId + `/packages?status=all`).pipe(map((res) => res));
	}

	addNewChildOnLogin(userId, data) {
		return this.http.post(`${this.apiHostUrl}/add/child/users/${userId}/child`, data).pipe(map((res) => res));
	}

	updateChildLaguages(childId, data) {
		return this.http.post(`${this.apiHostUrl}/update/chid/laguages/${childId}`, data).pipe(map((res) => res));
	}

	updateCertificateName(childId, data) {
		return this.http.post(`${this.apiHostUrl}/updatecertificatename/${childId}`, data).pipe(map((res) => res));
	}

	getSignInMessage() {
		return this.http.get<any>(`${this.apiHostUrl}/sign-in-message/get-today-message`).pipe(map((res) => res));
	}

	getCountryName(ip) {
		return this.http.get<any>(`${this.apiHostUrl}/get/country-name/${ip}`).pipe(map((res) => res));
	}
	getPromotionalBanner(data) {
		return this.http.post(`${this.apiHostUrl}/get-promotional-banners`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getReferDataByMarket(market) {
		return this.http.get<any>(`${this.apiHostUrl}/refer-data-by-market/${market}`).pipe(map((res) => res));
	}

	increasedReferCount(userId) {
		return this.http.get(`${this.apiHostUrl}/add-user-reffer-count/${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	addFreeRefferPackageToUserAccount(data) {
		return this.http.post(`${this.apiHostUrl}/add-reffer-package-into-user-account`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	deleteUserconfirmed(userId) {
		return this.http.delete(`${this.apiHostUrl}/account-delete-confirmed-by-user/${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	cancelDeleteUserconfirmed(userId) {
		return this.http.put(`${this.apiHostUrl}/cancel-delete-accout-request-by-user/${userId}`, '').pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUsersDeleteConfirmed(market) {
		return this.http.get(`${this.apiHostUrl}/get-user-details-delete-account-confirmed/${market}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUsersDeleteConfirmedFiltered(searchKey, market, page) {
		return this.http
			.get(
				`${this.apiHostUrl}/get-user-details-delete-account-confirmed-by-search/${searchKey}/filteredSearch?market=${market}&page=${page}`
			)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	deleteUserByAdmin(userId) {
		return this.http.delete(`${this.apiHostUrl}/delete-user-account-by-admin/${userId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserDetailsForEmailVerification(userID) {
		return this.http.get(`${this.apiHostUrl}/get-user-details-for-email-confirmation/${userID}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	submitCouponCode(data) {
		return this.http.post(`${this.apiHostUrl}/redeem-coupon-code`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	downloadSalesInvoice(packageId) {
		return this.http.get(`${this.apiHostUrl}/downloadInvoice?id=${packageId}`, { responseType: 'blob' }).pipe();
	}

	downloadGiftingUserInvoice(packageId) {
		return this.http
			.get(`${this.apiHostUrl}/download-gifting-user-invoice?id=${packageId}`, { responseType: 'blob' })
			.pipe();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getAllClientList(parentClientId) {
		return this.http.get(`${this.apiHostUrl}/${parentClientId}/get-all-child-client-list`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	uploadLearnerUserInBulk(data) {
		return this.http
			.post(`${this.apiHostUrl}/create-learner-user-in-bulk`, data, {
				responseType: 'blob',
			})
			.pipe();
	}

	upLearnerUserInBulk(data) {
		return this.http
			.post(`${this.apiHostUrl}/update-learner-user-in-bulk`, data, {
				responseType: 'blob',
			})
			.pipe();
	}

	uploadDripInBulk(data, roleId, userId, clientId) {
		return this.http
			.post(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/create-drip-in-bulk`, data, { responseType: 'blob' })
			.pipe();
	}

	uploadLinkAssetInBulk(data, userId, clientId) {
		return this.http
			.post(`${this.apiHostUrl}/${userId}/${clientId}/create-link-asset-in-bulk`, data, { responseType: 'blob' })
			.pipe();
	}

	getAppBranding(clientId) {
		return this.http.get(`${this.apiHostUrl}/get-client-app-branding/${clientId}?type=${this.type}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getIPAddress() {
		return this.http.get(`https://api.ipify.org/?format=json`, this.httpOptions).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserRolesPermission(payload) {
		return this.http.post(`${this.apiHostUrl}/users/get-users-permissions`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getUserBellNotifcation(page, limit) {
		return this.http.get(`${this.apiHostUrl}/${this.type}/get-user-bell-notifcation?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	readAllBellNotification() {
		return this.http.put(`${this.apiHostUrl}/${this.type}/read-all-bell-notification`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkUploadLearnerData(roleId, userId, clientId) {
		return this.http
			.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/learner/check-all-notification-report-data`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getUploadLearnerData(roleId, userId, clientId) {
		return this.http
			.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/learner/download-uploaded-learner-data`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getUpdateLearnerData(roleId, userId, clientId) {
		return this.http
			.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/learner/download-updated-learner-data`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getUploadOnlyOnWhatsAppData(roleId, userId, clientId, type) {
		return this.http
			.get(`${this.apiHostUrl}/${roleId}/${userId}/${clientId}/${type}/drip/download-drip-excel-data`)
			.pipe(
				map((data) => {
					return data;
				})
			);
	}

	getUploadLinkAssetData(userId, clientId) {
		return this.http.get(`${this.apiHostUrl}/${userId}/${clientId}/drip/download-link-asset-excel-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkUserBellNotification() {
		return this.http.get(`${this.apiHostUrl}/check-new-notifcation`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	logout() {
		return this.http.post(`${this.apiHostUrl}/logout/admin`, null).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkGoogleDriveDetails() {
		if (localStorage.getItem('user')) {
			let userDetails = JSON.parse(localStorage.getItem('user')).user;
			if (userDetails?.access_token) {
				this.googleDriveLogin = true;
			}
		} else {
			this.googleDriveLogin = false;
		}
		console.log('--this.googleDriveLogin--', this.googleDriveLogin);
	}

	checkTeamAccessTokenByClientId(clientId) {
		return this.http.get(`${this.apiHostUrl}/check-teams-access-token-by-client-id/${clientId}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	//Icon App Brancding
	applyWhiteBrandingOnTheSVGIcon(color, iconName) {
		const svgIcons = this.allIconData;
		const svgIcon = svgIcons[iconName];
		if (!svgIcon) {
			console.error(`Icon with name ${iconName} not found`);
			return;
		}
		const coloredSvgIcon = svgIcon.replaceAll('#6513e1', `${color}`);
		return coloredSvgIcon;
	}
	getAllSVGIconData() {
		return this.http.get(`/assets/all_in_one/icons.json`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	setPaginationWhiteBranding() {
		document.documentElement.style.setProperty(`--pagination-color`, this.whiteBrandingColor);
		document.documentElement.style.setProperty(`--check-box-color`, this.whiteBrandingColor);
		return;
	}

	async setIconWhiteBranding(iconObject, color = null) {
		setTimeout(() => {
			if (localStorage.getItem('app_branding') && JSON.parse(localStorage.getItem('app_branding')).accent_color) {
				this.whiteBrandingColor = JSON.parse(localStorage.getItem('app_branding')).accent_color;
			} else {
				this.whiteBrandingColor = this.webAccent_color ? this.webAccent_color : '#6513e1';
			}
		}, 50);

		for (let iconName in iconObject) {
			let name = iconName;
			iconObject[iconName] = await this.changeColorAndApply(name, this.whiteBrandingColor);
		}
		this.setPaginationWhiteBranding();
	}

	async changeColorAndApply(name, color) {
		let icon: any = await this.applyWhiteBrandingOnTheSVGIcon(color, name);
		let finalIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(icon);
		return finalIcon;
	}

	/////////////////////////////////////

	async setSiteBranding(projectType) {
		let data = await this.getSiteBranding();
		console.log('-data-', data);
		console.log('-projectType-', projectType);

		if (!data) {
			// console.error('----No branding data -----');
			return;
		}

		if (projectType == 'drip') {
			if (
				!data.dripWeb_Login_LogoPath ||
				!data.dripWeb_LogoPath ||
				!data.dripWeb_About_LogoPath ||
				!data.dripWeb_About_Text ||
				!data.drip_accent_color
			) {
				console.error('-----Missing branding data for drip project---------');
				return;
			}

			let dripURL = this.imageHost + data.dripWeb_Login_LogoPath;
			this.loginWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(dripURL);

			let dripDefaultURL = this.imageHost + data.dripWeb_LogoPath;
			this.defaultWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(dripDefaultURL);

			let dripAboutURL = this.imageHost + data.dripWeb_About_LogoPath;
			this.aboutWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(dripAboutURL);

			this.aboutWebText = data.dripWeb_About_Text;
			this.webAccent_color = data.drip_accent_color;
		} else if (projectType == 'diwo') {
			if (
				!data.diwoWeb_Login_LogoPath ||
				!data.diwoWeb_LogoPath ||
				!data.diwoWeb_About_LogoPath ||
				!data.diwoWeb_About_Text ||
				!data.diwo_accent_color
			) {
				console.error('-----Missing branding data for diwo project---------');
				return;
			}

			let diwoURL = this.imageHost + data.diwoWeb_Login_LogoPath;
			this.loginWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(diwoURL);

			let diwoDefaultURL = this.imageHost + data.diwoWeb_LogoPath;
			this.defaultWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(diwoDefaultURL);

			let diwoAboutURL = this.imageHost + data.diwoWeb_About_LogoPath;
			this.aboutWebLogo = this.sanitizer.bypassSecurityTrustResourceUrl(diwoAboutURL);

			this.aboutWebText = data.diwoWeb_About_Text;
			this.webAccent_color = data.diwo_accent_color;
		}

		return;
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

	///////////////////////////////////////////

	getLoginAppBrading() {
		return this.http.get(`${this.apiHostUrl}/get-login-app-branding`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getconfigurableFeature() {
		return this.http.get(`${this.apiHostUrl}/get-configurable-feature`).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
