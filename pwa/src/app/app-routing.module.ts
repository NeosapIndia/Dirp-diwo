import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{
		path: 'tabs',
		loadChildren: () => import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),
	},
	{
		path: 'login',
		loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginPageModule),
	},
	{
		path: 'login-otp',
		loadChildren: () => import('./pages/login-otp/login-otp.module').then((m) => m.LoginOtpPageModule),
	},
	{
		path: 'switch-account',
		loadChildren: () => import('./pages/switch-account/switch-account.module').then((m) => m.SwitchAccountPageModule),
	},
	{
		path: 'register-user',
		loadChildren: () => import('./pages/register-user/register-user.module').then((m) => m.RegisterUserPageModule),
	},
	{
		path: 'mark-present',
		loadChildren: () => import('./pages/mark-present/mark-present.module').then((m) => m.MarkPresentPageModule),
	},
	{
		path: 'otp',
		loadChildren: () => import('./pages/otp/otp.module').then((m) => m.OtpPageModule),
	},

	{
		path: 'post-detail',
		loadChildren: () => import('./pages/post-detail/post-detail.module').then((m) => m.PostDetailPageModule),
	},
	{
		path: 'drip-detail',
		loadChildren: () => import('./pages/drip-detail/drip-detail.module').then((m) => m.DripDetailPageModule),
	},

	{
		path: 'notifications',
		loadChildren: () => import('./pages/notification/notification.module').then((m) => m.NotificationPageModule),
	},

	{
		path: 'about-us',
		loadChildren: () => import('./pages/about-us/about-us.module').then((m) => m.AboutUsPageModule),
	},
	{
		path: 'all-modules',
		loadChildren: () => import('./pages/all-workbooks/all-workbooks.module').then((m) => m.AllWorkbooksPageModule),
	},
	{
		path: 'all-worksheets',
		loadChildren: () => import('./pages/all-worksheets/all-worksheets.module').then((m) => m.SingleWorkbookPageModule),
	},
	{
		path: 'all-worksheets-print',
		loadChildren: () =>
			import('./pages/all-worksheets-print/all-worksheets-print.module').then((m) => m.AllWorksheetPageModule),
	},
	{
		path: 'all-worksheets-preview',
		loadChildren: () =>
			import('./pages/all-worksheets-preview/all-worksheets-preview.module').then(
				(m) => m.allworksheetsPreviewPageModule
			),
	},
	{
		path: 'worksheet-preview',
		loadChildren: () =>
			import('./pages/worksheet-preview/worksheet-preview.module').then((m) => m.WorksheetpreviewPageModule),
	},
	{
		path: 'worksheet',
		loadChildren: () => import('./pages/worksheet/worksheet.module').then((m) => m.WorksheetPageModule),
	},
	{
		path: 'about-us',
		loadChildren: () => import('./pages/about-us/about-us.module').then((m) => m.AboutUsPageModule),
	},
	{
		path: 'policy-notification',
		loadChildren: () =>
			import('./pages/policy-notification/policy-notification-page.module').then(
				(m) => m.ManagePolicyNotifcationPageModule
			),
	},
	{
		path: 'whatsapp-opt-in',
		loadChildren: () =>
			import('./pages/whatsApp-opt-in-accept-page/whatsApp-opt-in-accept-page.module').then(
				(m) => m.ManageWhatsAppOptInAcceptPageModule
			),
	},
	{
		path: 'cookie-acceptance',
		loadChildren: () =>
			import('./pages/cookie-acceptance/cookie-acceptance-page.module').then((m) => m.ManagecookieAcceptancePageModule),
	},
	{
		path: 'land-rover',
		loadChildren: () => import('./pages/land-rover/land-rover.module').then((m) => m.LandRoverPageModule),
	},
	{
		path: 'thank-you',
		loadChildren: () => import('./pages/thank-you/thank-you.module').then((m) => m.ThankYouPageModule),
	},
	{
		path: 'custom-template',
		loadChildren: () =>
			import('./pages/custom-template/custom-template.module').then((m) => m.CustomTemplatePageModule),
	},
	{
		path: 'reset-password',
		loadChildren: () => import('./pages/reset-password/reset-password.module').then((m) => m.ResetPasswordPageModule),
	},
	{
		path: 'forgot-password',
		loadChildren: () =>
			import('./pages/forgot-password/forgot-password.module').then((m) => m.ForgotPasswordPageModule),
	},
	// {
	// 	path: 'all-pathways',
	// 	loadChildren: () => import('./pages/diwo-all-pathways/all-pathways.module').then((m) => m.AllPathwaysPageModule),
	// },
	// {
	// 	path: 'all-courses',
	// 	loadChildren: () => import('./pages/diwo-all-courses/all-courses.module').then((m) => m.AllCoursesPageModule),
	// },
	// {
	// 	path: 'all-todos-workbooks',
	// 	loadChildren: () =>
	// 		import('./pages/diwo-all-todos-workbook/all-todos-workbook.module').then((m) => m.AllTodosWorkbookPageModule),
	// },
	// {
	// 	path: 'pathway-detail',
	// 	loadChildren: () =>
	// 		import('./pages/diwo-pathway-detail/pathway-detail.module').then((m) => m.PathwayDetailPageModule),
	// },
	// {
	// 	path: 'course-detail',
	// 	loadChildren: () => import('./pages/diwo-course-detail/course-detail.module').then((m) => m.CourseDetailPageModule),
	// },

	{
		path: '',
		// redirectTo: 'login',
		// pathMatch: 'full'
		loadChildren: () => import('./pages/logout-page/logout-page.module').then((m) => m.LogOutPageModule),
	},
];
@NgModule({
	imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
