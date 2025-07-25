import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { timeout, catchError } from 'rxjs/operators';

import { AuthenticationService } from '../auth/authentication';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
	constructor(
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private authenticationService: AuthenticationService
	) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(request).pipe(
			timeout(5 * 60 * 1000),
			catchError((err) => {
				this.spinnerService.hide();
				if (JSON.parse(JSON.stringify(err)).name == 'TimeoutError') {
					this.toastr.error('Seems server did not respond. Please try after some time.', 'Error');
					// return throwError('seems server did not respond, Please try after some time');
				} else if (err.status === 401) {
					this.toastr.error(err.error.error, 'Error');
					// auto logout if 401 response returned from api
					this.authenticationService.logout();
					// location.reload(true);
					// } else if (err.status === 403) {
					//     this.toastr.error('Sorry! You are not authorised to view this content.', 'Error');
				} else if (err.status === 404) {
					this.toastr.error('Requested page not found', 'Error');
				} else if (err.statusText == 'Unknown Error') {
					this.toastr.error('Seems server did not respond. Please try after some time.', 'Error');
					// return throwError('seems server did not respond, Please try after some time');
				} else if (err.status === 400) {
					return throwError(err);
				} else {
					this.toastr.error(err.error.error, 'Error');
				}
				return throwError('');
				// const error = err.error.error || err.statusText;
				// return throwError(error);
			})
		);
	}
}