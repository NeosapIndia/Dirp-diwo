import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RouterModule } from '@angular/router';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ToastrModule } from 'ngx-toastr';
import { NgxPermissionsModule } from 'ngx-permissions';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { BabygqHeaderComponent } from './layouts/babygq-header/babygq-header-layout.component';
import { BabygqSidebarComponent } from './layouts/babygq-sidebar/babygq-sidebar-layout.component';
import { AdminLayoutComponent } from './layouts/admin/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { ManageUserService } from './manage-user/manage-user.service';
import { DragulaModule } from 'ng2-dragula';

import {
	AuthGuard,
	AlertService,
	AuthenticationService,
	JwtInterceptor,
	ErrorInterceptor,
	AlertComponent,
	UserService,
	SharedPipesModule,
} from './shared';
import { CanDeactivateGuard } from './shared/guard/can-deactivate.guard';
import { AppRoutes } from './app.routing';
import { EditorModule } from '@tinymce/tinymce-angular';
import { NgxPaginationModule } from 'ngx-pagination';
import { RecaptchaModule } from 'ng-recaptcha';
import { QrCodeModule } from 'ng-qrcode';
import { MzdTimelineModule } from 'ngx-mzd-timeline';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TagCloudComponent } from 'angular-tag-cloud-module';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';

export const createTranslateLoader = (http: HttpClient) => {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
};

interface NgxSpinnerConfig {
	type?: string;
}

@NgModule({
	declarations: [
		AppComponent,
		AlertComponent,
		AdminLayoutComponent,
		AuthLayoutComponent,
		BabygqHeaderComponent,
		BabygqSidebarComponent,
	],
	imports: [
		CommonModule,
		BrowserModule,
		NgSelectModule,
		NgxChartsModule,
		FormsModule,
		ReactiveFormsModule,
		HttpClientModule,
		RecaptchaModule,
		TagCloudComponent,
		DragulaModule.forRoot(),
		ToastrModule.forRoot({
			positionClass: 'toast-bottom-right',
			maxOpened: 1,
			autoDismiss: true,
			preventDuplicates: true,
			timeOut: 10000,
		}),
		SharedPipesModule,
		NgxPermissionsModule.forRoot(),
		NgxPaginationModule,
		RouterModule.forRoot(AppRoutes),
		BrowserAnimationsModule,
		NoopAnimationsModule,
		ConfirmDialogModule,
		NgxSpinnerModule.forRoot({ type: 'ball-pulse' }),
		NgxDaterangepickerMd.forRoot(),
		EditorModule,
		NgxPaginationModule,
		MzdTimelineModule,
		QrCodeModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: createTranslateLoader,
				deps: [HttpClient],
			},
		}),
		YouTubePlayerModule,
	],
	providers: [
		AppService,
		ManageUserService,
		AuthGuard,
		AlertService,
		UserService,
		AuthenticationService,
		CanDeactivateGuard,
		{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
		{ provide: LocationStrategy, useClass: HashLocationStrategy },
	],

	bootstrap: [AppComponent],
	entryComponents: [],
})
export class AppModule {}
