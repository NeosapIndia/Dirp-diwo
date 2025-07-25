import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { AuthGuard } from './shared';
import { CanDeactivateGuard } from './shared/guard/can-deactivate.guard';
export const AppRoutes: Routes = [
	{
		path: '',
		component: AdminLayoutComponent,
		canActivate: [AuthGuard],
		canActivateChild: [NgxPermissionsGuard],
		children: [
			{
				path: 'home',
				loadChildren: () => import('./manage-home/manage-home.module').then((m) => m.ManageHomeModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-home',
				loadChildren: () => import('./manage-diwo-home/manage-diwo-home.module').then((m) => m.ManageDiwoHomeModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'land-rover',
				loadChildren: () => import('./land-rover/land-rover.module').then((m) => m.LandRoverModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'user',
				loadChildren: () => import('./manage-user/manage-user.module').then((m) => m.ManageUserModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'user-group',
				loadChildren: () => import('./manage-user-group/manage-user-group.module').then((m) => m.ManageUserGroupModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'whatsapp-admin',
				loadChildren: () =>
					import('./manage-whatsapp-admin/manage-whatsapp-admin.module').then((m) => m.ManageWhatsappAdminModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'whatsapp-template',
				loadChildren: () =>
					import('./manage-whatsapp-template/manage-whatsapp-template.module').then(
						(m) => m.ManageWhatsappTemplateModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'sales',
				loadChildren: () => import('./manage-sales/manage-sales.module').then((m) => m.ManageSalesModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'licenses',
				loadChildren: () =>
					import('./manage-products-and-packages/manage-products-and-packages.module').then(
						(m) => m.ManageProductsAndPackagesModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-licenses',
				loadChildren: () =>
					import('./manage-diwo-license/manage-diwo-license.module').then((m) => m.ManageDiwoLicenseModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'whatsapp-setup',
				loadChildren: () =>
					import('./manage-whatsapp-setups/manage-whatsapp-setups.module').then((m) => m.ManageWhatsAppSetupsModule),

				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'teams-setup',
				loadChildren: () =>
					import('./manage-teams-setups/manage-teams-setups.module').then((m) => m.ManageTeamSetupsModule),

				data: {
					permissions: {
						only: ['PRODUCT OWNER SUPER ADMIN', 'PRODUCT OWNER ADMIN', 'CLIENT ADMIN', 'BRANCH ADMIN'],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'learning-analytics',
				loadChildren: () =>
					import('./manage-learning-analytics/manage-learning-analytics.module').then(
						(m) => m.ManageLearningAnalyticsModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-learning-analytics',
				loadChildren: () =>
					import('./manage-diwo-analytics/manage-diwo-analytics.module').then((m) => m.ManageDiwoAnalyticsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'chats',
				loadChildren: () => import('./manage-chats/manage-chats.module').then((m) => m.ManageChatsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'drip-flows',
				loadChildren: () => import('./manage-drip-flow/manage-drip-flow.module').then((m) => m.ManageDripFlowsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'drips-library',
				loadChildren: () =>
					import('./manage-posts-library/manage-posts-library.module').then((m) => m.ManagePostsLibraryModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'assets-library',
				loadChildren: () =>
					import('./manage-assets-library/manage-assets-library.module').then((m) => m.ManageAssetsLibraryModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'document-library',
				loadChildren: () =>
					import('./manage-document-library/manage-document-library.module').then((m) => m.ManageDocumentLibraryModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'clients',
				loadChildren: () => import('./manage-clients/manage-clients.module').then((m) => m.ManageClientsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'learners',
				loadChildren: () => import('./manage-learners/manage-learners.module').then((m) => m.ManageLearnersModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'contacts',
				loadChildren: () => import('./manage-learners/manage-learners.module').then((m) => m.ManageLearnersModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'contact-groups',
				loadChildren: () =>
					import('./manage-learner-groups/manage-learner-groups.module').then((m) => m.ManageLearnerGroupsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'learner-groups',
				loadChildren: () =>
					import('./manage-learner-groups/manage-learner-groups.module').then((m) => m.ManageLearnerGroupsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'manage-account',
				loadChildren: () => import('./manage-account/manage-account.module').then((m) => m.ManageAccountModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'switch-user-role',
				loadChildren: () =>
					import('./manage-switch-user-role/manage-switch-user-role.module').then((m) => m.ManageSwitchUserRoleModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'my-subscriptions',
				loadChildren: () =>
					import('./manage-my-subscriptions/manage-my-subscriptions.module').then((m) => m.ManageMySubscriptionsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'settings',
				loadChildren: () => import('./manage-settings/manage-settings.module').then((m) => m.ManageSettingsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'integrations',
				loadChildren: () =>
					import('./manage-integrations/manage-integrations.module').then((m) => m.ManageIntegrationsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'general-settings',
				loadChildren: () =>
					import('./manage-app-branding/manage-app-branding.module').then((m) => m.ManageAppBrandingModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'agents',
				loadChildren: () => import('./manage-agents/manage-agents.module').then((m) => m.ManageAssetsLibraryModule),
				data: {
					permissions: {
						only: ['PRODUCT OWNER SUPER ADMIN', 'PRODUCT OWNER ADMIN'],
						redirectTo: '/access-denied',
					},
				},
			},
			// Workbook
			{
				path: 'module',
				loadChildren: () => import('./manage-workbook/manage-workbook.module').then((m) => m.ManageWorkbookModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'session',
				loadChildren: () => import('./manage-session/manage-session.module').then((m) => m.ManageSessionModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'session-timeline',
				loadChildren: () =>
					import('./manage-session/session-timeline/session-timeline.module').then((m) => m.SessionTimelineModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-courses',
				loadChildren: () =>
					import('./manage-diwo-courses/manage-diwo-courses.module').then((m) => m.ManageDiwoCoursesModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-pathways',
				loadChildren: () =>
					import('./manage-diwo-pathways/manage-diwo-pathways.module').then((m) => m.ManageDiwoPathwaysModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-pathway-assignment',
				loadChildren: () =>
					import('./manage-diwo-pathway-assignment/manage-diwo-pathway-assignment.module').then(
						(m) => m.ManageDiwoPathwayAssignmentModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-course-assignment',
				loadChildren: () =>
					import('./manage-diwo-course-assignment/manage-diwo-course-assignment.module').then(
						(m) => m.ManageDiwoCourseAssignmentModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'diwo-module-assignment',
				loadChildren: () =>
					import('./manage-diwo-module-assignment/manage-diwo-module-assignment.module').then(
						(m) => m.ManageDiwoModuleAssignmentModule
					),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},

			{
				path: 'about-us',
				loadChildren: () => import('./manage-about-us/manage-about-us.module').then((m) => m.ManageAboutUsModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'master-setting',
				loadChildren: () =>
					import('./manage-master-settings/manage-master-settings.module').then((m) => m.ManageMasterSettingsModule),
				data: {
					permissions: {
						only: ['PRODUCT OWNER SUPER ADMIN', 'PRODUCT OWNER ADMIN'],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'opt-ins',
				loadChildren: () => import('./manage-opt-ins/manage-opt-ins.module').then((m) => m.ManageOptInsModule),
				data: {
					permissions: {
						only: ['PRODUCT OWNER SUPER ADMIN', 'PRODUCT OWNER ADMIN', 'PARTNER SUPER ADMIN'],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'notifications',
				loadChildren: () =>
					import('./manage-notification/manage-notification.module').then((m) => m.ManageNotificationModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'support',
				loadChildren: () => import('./manage-support/manage-support.module').then((m) => m.ManageSupportModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN',
							'PARTNER SUPER ADMIN',
							'PARTNER ADMIN',
							'CLIENT ADMIN',
							'BRANCH ADMIN',
							'ANALYST',
							'CONTENT AUTHOR',
							'BUSINESS MANAGER',
							'FACILITATOR',
						],
						redirectTo: '/access-denied',
					},
				},
			},
			{
				path: 'system-health',
				loadChildren: () =>
					import('./manage-system-health/manage-system-health.module').then((m) => m.ManageSystemHealthModule),
				data: {
					permissions: {
						only: [
							'PRODUCT OWNER SUPER ADMIN',
							'PRODUCT OWNER ADMIN'
							
						],
						redirectTo: '/access-denied',
					},
				},
			},
		],
	},
	{
		path: '',
		component: AuthLayoutComponent, // For Header only
		children: [
			{ path: 'login', loadChildren: () => import('./login/login.module').then((m) => m.LoginModule) },
			{
				path: 'add-edit-module',
				canDeactivate: [CanDeactivateGuard],
				loadChildren: () =>
					import('./manage-workbook/add-edit-workbook/add-edit-workbook.module').then(
						(m) => m.ManageAddEditWorkbookModule
					),
			},
			{
				path: 'add-edit-scorm-module',
				// canDeactivate: [CanDeactivateGuard],
				loadChildren: () =>
					import('./manage-workbook/add-edit-scorm-workbook/add-edit-scorm-workbook.module').then(
						(m) => m.ManageAddEditScormWorkbookModule
					),
			},
			{
				path: 'add-edit-session',
				loadChildren: () =>
					import('./manage-session/add-edit-session/add-edit-session.module').then((m) => m.ManageAddEditSessionModule),
			},
			{
				path: 'closing-session',
				loadChildren: () =>
					import('./manage-session/closing-session/closing-session.module').then((m) => m.ManageClosingSessionModule),
			},
			{
				path: 'session-details/:code',
				loadChildren: () =>
					import('./manage-session/session-timeline/session-timeline.module').then((m) => m.SessionTimelineModule),
			},

			{ path: 'not-found', loadChildren: () => import('./not-found/not-found.module').then((m) => m.NotFoundModule) },

			{
				path: 'forgot-password',
				loadChildren: () =>
					import('./manage-forgot-password/manage-forgot-password.module').then((m) => m.ManageForgotPasswordModule),
			},

			{
				path: 'reset-password',
				loadChildren: () =>
					import('./manage-reset-password/manage-reset-password.module').then((m) => m.ManageResetPasswordModule),
			},

			{
				path: 'error',
				loadChildren: () => import('./server-error/server-error.module').then((m) => m.ServerErrorModule),
			},

			{
				path: 'access-denied',
				loadChildren: () => import('./access-denied/access-denied.module').then((m) => m.AccessDeniedModule),
			},

			{ path: '**', redirectTo: 'not-found' },
		],
	},
];
