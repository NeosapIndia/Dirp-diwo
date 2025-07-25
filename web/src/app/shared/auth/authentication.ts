import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';

@Injectable()
export class AuthenticationService {
	apiHostUrl: string;
	type: string = null;
	constructor(private http: HttpClient, private router: Router, private permissionsService: NgxPermissionsService) {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.type = 'drip';
			this.apiHostUrl = hostName + '/v1';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.type = 'diwo';
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
		if (!this.type) {
			setTimeout(() => {
				this.type = localStorage.getItem('projectName');
			}, 1000);
		}
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

	login(data) {
		data.type = this.type;
		return this.http.post<any>(`${this.apiHostUrl}/get-web-validate-user`, data).pipe(
			map((user) => {
				if (user) {
					if (user?.user) {
						user.user = this.removePersonalData(user.user);
					}
					localStorage.setItem('user', JSON.stringify(user));
					localStorage.setItem('isLoggedin', 'true');

					this.setLocalLanguage('en');
				}
				return user;
			})
		);
	}
	generateOtp(data) {
		data.type = this.type;
		return this.http.post<any>(`${this.apiHostUrl}/get-web-login-otp`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	generatePhoneRegisterOtp(phone: string) {
		return this.http.put<any>(`${this.apiHostUrl}/phone`, { phone: phone }).pipe(
			map((data) => {
				return data;
			})
		);
	}

	validateRegistrationOtp(phone: string, password: string) {
		return this.http
			.post<any>(`${this.apiHostUrl}/validate/phone`, {
				phone: phone,
				otp: password,
			})
			.pipe(
				map((user) => {
					// login successful if there's a jwt token in the response
					if (user) {
						// store user details and jwt token in local storage to keep user logged in between page refreshes
						if (user?.user) {
							user.user = this.removePersonalData(user.user);
						}
						localStorage.setItem('user', JSON.stringify(user));
						localStorage.setItem('isLoggedin', 'true');
						// console.log('------------------3-----------------');
					}
					return user;
				})
			);
	}

	updateUserToken(role, client) {
		return this.http
			.post<any>(`${this.apiHostUrl}/update-admin-user-token-per-selected-role-client`, {
				RoleId: role,
				ClientId: client,
			})
			.pipe(
				map((user) => {
					if (user) {
						let userDetails = JSON.parse(localStorage.getItem('user'));
						// userDetails.token = user.token;
						if (userDetails?.user) {
							userDetails.user = this.removePersonalData(userDetails.user);
						}

						localStorage.setItem('user', JSON.stringify(userDetails));
						localStorage.setItem('isLoggedin', 'true');
						// console.log('------------------4-----------------');
					}
					//need to add Any Check if fail this request
					return user;
				})
			);
	}

	forgotPassword(data) {
		data.type = this.type;
		return this.http.post<any>(`${this.apiHostUrl}/admin-user-forgot-password`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	resetPassword(data) {
		data.type = this.type;
		return this.http.post<any>(`${this.apiHostUrl}/admin-user-reset-password`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	checkresetpasswordtokenValidity() {
		const token = localStorage.getItem('token');

		let data = {
			type: this.type,
			token: token,
		};
		return this.http.post<any>(`${this.apiHostUrl}/check-admin-user-reset-password-token-validity`, data).pipe(
			map((data) => {
				return data;
			})
		);
	}

	logout() {
		// remove user from local storage to log user out
		localStorage.removeItem('user');
		localStorage.removeItem('menupermission');
		localStorage.removeItem('role');
		setTimeout(() => {
			this.router.navigate(['/login']);
		}, 100);
		this.permissionsService.flushPermissions();
	}

	setLocalLanguage(lang) {
		/* TODO set language by user preference */
		switch (lang) {
			case 'en':
				lang = 'English';
				break;
			default:
				lang = 'English';
				break;
		}
		localStorage.setItem('language', lang);
	}
}
