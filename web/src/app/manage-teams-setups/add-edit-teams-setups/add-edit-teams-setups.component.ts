import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageTeamSetupService } from '../manage-teams-setups.service';
import { AppService } from 'src/app/app.service';
declare var $: any;
@Component({
	selector: 'app-add-edit-teams-setups',
	templateUrl: './add-edit-teams-setups.component.html',
	styleUrls: ['./add-edit-teams-setups.component.css'],
})
export class AddEditTeamSetupsComponent implements OnInit {
	teamSetupDetailsForm: FormGroup;
	userClient: any;
	ClientList: any;
	setupId: any;
	clientId: any;
	editClientData: any;
	selecteAllChildClient = false;
	childClientList = [];
	pageDetails: any;
	projectType = 'drip';
	userDetails: any;
	isEdit = false;
	UserId;
	childClientDetails = [];
	showSignIn = true;
	mainTeamSetup: any;
	disableUpdate = false;
	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private teamSetupService: ManageTeamSetupService,
		private router: Router,
		private route: ActivatedRoute
	) {
		if (localStorage.getItem('projectName') && localStorage.getItem('projectName') == 'diwo') {
			this.projectType = 'diwo';
		}
	}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.pageDetails = JSON.parse(localStorage.getItem('TeamSetupPageNo')) || null;
		if (localStorage.getItem('user')) {
			this.UserId = JSON.parse(localStorage.getItem('user')).user.id;
		}
		this.createTeamSetupDetailsForm();
		if (this.route?.snapshot?.queryParams?.teamSetupId) {
			this.isEdit = true;
			this.showSignIn = false;
			this.setupId = this.route.snapshot.queryParams.teamSetupId;
			this.getTeamSetupById();
		}
	}

	getTeamSetupById() {
		this.teamSetupService.getTeamsAppSetUpById(this.setupId).subscribe((res: any) => {
			if (res.success) {
				this.userDetails = res.data.userDetails;
				this.childClientDetails = res.data.teamSetupOtherClientData;
				this.mainTeamSetup = res.data.mainTeamSetup;
				if (this.mainTeamSetup.UserId != this.UserId || this.mainTeamSetup.ClientId != this.userClient.id) {
					this.disableUpdate = true;
					// console.log('disableUpdate', this.disableUpdate);
				}
			}
		});
	}

	createTeamSetupDetailsForm() {
		this.teamSetupDetailsForm = this.formBuilder.group({
			id: null,
			ClientId: [null],
		});
	}
	get f() {
		return this.teamSetupDetailsForm.controls;
	}

	markAsTouched(group: FormGroup | FormArray) {
		Object.keys(group.controls).map((field) => {
			const control = group.get(field);
			if (control instanceof FormControl) {
				control.markAsTouched({ onlySelf: true });
			} else if (control instanceof FormGroup) {
				this.markAsTouched(control);
			}
		});
	}

	saveTeamSetup() {
		this.teamSetupService.updateTeamSetupChildClient(this.setupId, this.childClientDetails).subscribe((res: any) => {
			if (res.success) {
				//Add Success Tostor Message
				this.toastr.success(
					this.appService.getTranslation('Pages.TeamSetups.Home.Toaster.updateTeamSetup'),
					this.appService.getTranslation('Utils.success')
				);
				this.router.navigate(['/teams-setup']);
			} else {
				// this.toastr.error(res.message);
				//Add Error Tostor Message
			}
		});
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/teams-setup']);
			}, 100);
		} else {
			this.router.navigate(['/teams-setup']);
		}
	}

	changeOneToggle(flag) {
		if (flag == false) {
			this.selecteAllChildClient = false;
		}
		if (flag == true) {
			let flag_ = true;
			for (let client of this.childClientDetails) {
				if (!client.haveTeamSetup) {
					flag_ = false;
				}
			}
			this.selecteAllChildClient = flag_;
		}
	}

	selectAllChildClient() {
		for (let client of this.childClientDetails) {
			client.haveTeamSetup = this.selecteAllChildClient;
		}
	}
	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('TeamSetupPageNo', JSON.stringify(payload));
	}

	signInToTeams() {
		this.cancelSignInPopUp();
		this.teamSetupService.getTeamsAuthUrl().subscribe((res: any) => {
			if (res.success) {
				window.open(res.redirectUrl, '_self');
			}
		});
	}

	signOutToTeams() {
		if (this.mainTeamSetup.UserId === this.UserId && this.mainTeamSetup.ClientId === this.userClient.id) {
			this.teamSetupService.revokeTeamSignIn(this.setupId).subscribe((res: any) => {
				if (res.success) {
					// Add Sign Out Tostor Message
					this.appService.checkNotifcation = true;
					this.toastr.success(
						this.appService.getTranslation('Pages.TeamSetups.Home.Toaster.signOut'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/teams-setup']);
				}
			});
		} else {
			this.toastr.error(
				this.appService.getTranslation('Pages.TeamSetups.Home.Toaster.notauthorized'),
				this.appService.getTranslation('Utils.error')
			);
		}
	}

	cancelSignInPopUp() {
		$('#teamSetupSignInPopUp').modal('hide');
		$('#teamSetupSignOutPopUp').modal('hide');
	}

	showSignInPopUp() {
		$('#teamSetupSignInPopUp').modal('show');
	}

	signOutPopUp() {
		$('#teamSetupSignOutPopUp').modal('show');
	}

	syncChannels() {
		//Add Loader
		this.spinnerService.show();
		this.teamSetupService.syncTeamChannel(this.setupId).subscribe((res: any) => {
			this.spinnerService.hide();
			if (res.success) {
				// Add Sync Tostor Message
				this.toastr.success(
					this.appService.getTranslation('Pages.TeamSetups.AddEdit.Toaster.syncChannels'),
					this.appService.getTranslation('Utils.success')
				);
			}
		});
	}
}
