import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { environment } from 'src/environments/environment';
import { AppService } from '../app.service';

@Component({
	selector: 'app-manage-about-us',
	templateUrl: './manage-about-us.component.html',
	styleUrls: ['./manage-about-us.component.scss'],
	animations: [routerTransition()],
})
export class ManageAboutUsComponent implements OnInit {
	aboutUsInfo: any;

	imageHost = environment.imageHost + environment.imagePath;
	appVerion = environment.appVersion;
	roleId: any;
	writePermission: any;
	showNeosapStaticData: boolean = false;
	projectName: any;
	constructor(public appService: AppService) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.projectName = localStorage.getItem('projectName');
		// console.log('aboutUsInfo', this.aboutUsInfo);
		this.getRollPermission();
	}

	getRollPermission() {
		let payload = {
			roleId: this.roleId,
			permission: 'R',
			menuId: [27],
		};
		this.appService.getUserRolesPermission(payload).subscribe((res: any) => {
			if (res.success) {
				this.writePermission = res.data;
				if (
					this.writePermission &&
					this.writePermission.ispermission == true &&
					(this.writePermission.menuPermission.MenuId == 27 || this.writePermission.menuPermission.MenuId == '27') &&
					(this.writePermission.menuPermission.RoleId == 2 ||
						this.writePermission.menuPermission.RoleId == '2' ||
						this.writePermission.menuPermission.RoleId == 3 ||
						this.writePermission.menuPermission.RoleId == '3' ||
						this.writePermission.menuPermission.RoleId == 4 ||
						this.writePermission.menuPermission.RoleId == '4' ||
						this.writePermission.menuPermission.RoleId == 5 ||
						this.writePermission.menuPermission.RoleId == '5' ||
						this.writePermission.menuPermission.RoleId == 6 ||
						this.writePermission.menuPermission.RoleId == '6')
				) {
					this.showNeosapStaticData = true;
				} else {
					this.showNeosapStaticData = false;
				}
			}
		});
	}
}
