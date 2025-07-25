import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
	{
		path: '',
		component: TabsPage,
		children: [
			{
				path: 'all-drips',
				loadChildren: () => import('../all-post/all-post.module').then((m) => m.AllPostPageModule),
			},
			{
				path: 'search',
				loadChildren: () => import('../drip-search/drip-search.module').then((m) => m.DripSearchPageModule),
			},
			{
				path: 'diwo-search',
				loadChildren: () => import('../diwo-search/diwo-search.module').then((m) => m.DiwoSearchPageModule),
			},
			{
				path: 'notifications',
				loadChildren: () => import('../notification/notification.module').then((m) => m.NotificationPageModule),
			},
			{
				path: 'manage-profile',
				loadChildren: () => import('../manage-profile/manage-profile.module').then((m) => m.ManageProfilePageModule),
			},
			{
				path: 'all-modules',
				loadChildren: () => import('../all-workbooks/all-workbooks.module').then((m) => m.AllWorkbooksPageModule),
			},
			{
				path: 'all-pathways',
				loadChildren: () => import('../diwo-all-pathways/all-pathways.module').then((m) => m.AllPathwaysPageModule),
			},
			{
				path: 'all-courses',
				loadChildren: () => import('../diwo-all-courses/all-courses.module').then((m) => m.AllCoursesPageModule),
			},
			{
				path: 'see-all-workbooks',
				loadChildren: () =>
					import('../diwo-see-all-workbook/see-all-workbook.module').then((m) => m.SeeAllWorkbookPageModule),
			},
			{
				path: 'see-all-todos',
				loadChildren: () => import('../diwo-see-all-todos/see-all-todos.module').then((m) => m.SeeAllTodosPageModule),
			},
			{
				path: 'pathway-detail',
				loadChildren: () => import('../diwo-pathway-detail/pathway-detail.module').then((m) => m.PathwayDetailPageModule),
			},
			{
				path: 'course-detail',
				loadChildren: () => import('../diwo-course-detail/course-detail.module').then((m) => m.CourseDetailPageModule),
			},
			{
				path: '',
				redirectTo: '/tabs/all-drips',
				pathMatch: 'full',
			},
			{
				path: 'about-us',
				loadChildren: () => import('../about-us/about-us.module').then((m) => m.AboutUsPageModule),
			},
		],
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
