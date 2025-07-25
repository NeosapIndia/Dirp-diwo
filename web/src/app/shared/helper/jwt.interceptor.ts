import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// add authorization header with jwt token if available
		// let currentUser = JSON.parse(localStorage.getItem('user')) || null;
		// let isLoggedin = localStorage.getItem('isLoggedin');
		// let role = localStorage.getItem('role') ? localStorage.getItem('role') : 'No Role';
		// let user_raiserequest_name = localStorage.getItem('user_raiserequest_name')
		// ? localStorage.getItem('user_raiserequest_name')
		// : '';
		if (this.isHeaderNeeded(request.url)) {
			// if (currentUser) {
			request = request.clone({
				setHeaders: {
					// Authorization: `Bearer ${currentUser.token}`,
					// role: role,
					// user_raiserequest_name: user_raiserequest_name,
				},
			});
			request = request.clone({ withCredentials: true });
			// }
		}

		return next.handle(request);
	}

	isHeaderNeeded(url) {
		if (
			url.includes('vimeo.com') ||
			url.includes('api.ipify.org') ||
			(url.includes('X-Amz-SignedHeaders') && url.includes('X-Amz-Signature') && url.includes('X-Amz-Date'))
		) {
			return false;
		} else {
			return true;
		}
	}
}
