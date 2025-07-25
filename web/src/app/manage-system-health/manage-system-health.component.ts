import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';
import { environment } from 'src/environments/environment';
import { AppService } from '../app.service';
import { ManageSystemHealthService } from './manage-system-health.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-manage-system-health',
	templateUrl: './manage-system-health.component.html',
	styleUrls: ['./manage-system-health.component.scss'],
})
export class ManageSystemHealthComponent implements OnInit {
	aboutUsInfo: any;

	imageHost = environment.imageHost + environment.imagePath;
	appVerion = environment.appVersion;
	roleId: any;
	writePermission: any;
	showNeosapStaticData: boolean = false;
	projectName: any;
	system_HealthData: any;

	cpuColor: any;
	memoryColor: any;
	diskColor: any;
	lastUpdatedDateTime: any;

	iconObject = {
		cpuIcon: null,
		diskIcon: null,
		memoryIcon: null,
		temperatureIcon: null,
		uptimeIcon: null,
		expand_more_icon: null,
		expand_less_icon_30: null,
	};

	notificationFlagsDetail = {
		CPUNotification: false,
		DiskNotification: false,
		MemoryNotification: false,
	};

	showDiskDetails: boolean = false;

	constructor(
		public appService: AppService,
		public systemHealthService: ManageSystemHealthService,
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService
	) {}

	ngOnInit() {
		this.roleId = JSON.parse(localStorage.getItem('roleId')) || null;
		this.aboutUsInfo = JSON.parse(localStorage.getItem('app_branding'));
		this.projectName = localStorage.getItem('projectName');
		this.getAppBranding();
		this.getSystemHealthData();
		if (this.roleId == 2) {
			this.getSystemHealthNotificationData();
		}
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getSystemHealthData() {
		this.spinnerService.show();
		this.systemHealthService.getSystemHealthDetails().subscribe((res: any) => {
			if (res.success) {
				const now = new Date();
				this.lastUpdatedDateTime = this.formatDateTime(now);
				console.log('API called at:', this.lastUpdatedDateTime);
				this.system_HealthData = res.data;
				this.updateRAGColors();
				console.log('--system_HealthData--', this.system_HealthData);
				this.spinnerService.hide();
			}
		});
	}

	getSystemHealthNotificationData() {
		this.spinnerService.show();
		this.systemHealthService.getSystemHealthNotificationDetails().subscribe((res: any) => {
			if (res.success && res.data) {
				this.notificationFlagsDetail = { ...res.data }; // Patch response to model
			}
		});
	}

	updateSystemHealthNotificationData() {
		this.spinnerService.show();
		this.systemHealthService
			.updateSystemHealthNotificationDetails(this.notificationFlagsDetail)
			.subscribe((res: any) => {
				if (res.success) {
					this.toastr.success(
						this.appService.getTranslation('Pages.SystemHealth.Home.Toaster.notificationsettingupdate'),
						this.appService.getTranslation('Utils.success')
					);
				}
				this.spinnerService.hide();
			});
	}

	// Date-Time Formatter
	formatDateTime(date: Date): string {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		const year = date.getFullYear();

		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
	}

	refreshSystemHealthDetail() {
		this.getSystemHealthData();
	}

	getUptime(uptimeSeconds: number): string {
		if (!uptimeSeconds) return '0d 0h 0m';

		const days = Math.floor(uptimeSeconds / (24 * 3600));
		const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
		const minutes = Math.floor((uptimeSeconds % 3600) / 60);

		return `${days}d ${hours}h ${minutes}m`;
	}

	updateRAGColors() {
		const cpuUsage = Number(this.system_HealthData?.CPU_load);
		const memoryUsage = Number(this.system_HealthData?.RAM_usage_in_percentage);
		const diskUsage = Number(this.system_HealthData?.Disk_usage_in_percentage);

		this.cpuColor = this.getRAGColor(cpuUsage);
		this.memoryColor = this.getRAGColor(memoryUsage);
		this.diskColor = this.getRAGColor(diskUsage);
	}

	getRAGColor(usage: number): string {
		if (usage < 70) {
			return 'progress-bar-green';
		} else if (usage >= 70 && usage < 85) {
			return 'progress-bar-amber';
		} else {
			return 'progress-bar-red';
		}
	}

	toggleDiskDetails() {
		this.showDiskDetails = !this.showDiskDetails;
	}

	getDiskBarColor(percentage: number | string): string {
		const percent = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
		if (percent < 70) {
			return 'progress-bar-green';
		} else if (percent >= 70 && percent < 85) {
			return 'progress-bar-amber';
		} else {
			return 'progress-bar-red';
		}
	}
}
