import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { ManageAgentsService } from '../manage-agents.service';
declare var $: any;
@Component({
	selector: 'app-add-edit-agents',
	templateUrl: './add-edit-agents.component.html',
	styleUrls: ['./add-edit-agents.component.css'],
})
export class AddEditAgentsComponent implements OnInit {
	agentDetailsForm: FormGroup;
	userClient: any;
	ClientList: any;
	timePicker: any = [];
	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};
	setupId: any;
	clientId: any;
	editClientData: any;
	islicenseEdit: boolean = false;
	selecteAllChildClient = false;
	template_Category = [{ name: 'Utility' }, { name: 'Marketing' }, { name: 'Authentication' }];
	childClientList = [];
	pageDetails: any;
	projectType = 'drip';
	agent: any;
	isViewMode: boolean = false;
	configrationData;
	typeList = [{ name: 'OpenAI Assistant API' }, { name: 'Drip Custom Agent' }];

	versionList = [];

	iconObject = {
		add_icon_35: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		public appService: AppService,
		private spinnerService: NgxSpinnerService,
		private AgentService: ManageAgentsService,
		private router: Router,
		private route: ActivatedRoute
	) {
		if (localStorage.getItem('projectName') && localStorage.getItem('projectName') == 'diwo') {
			this.projectType = 'diwo';
		}
	}

	ngOnInit() {
		this.userClient = JSON.parse(localStorage.getItem('client'));
		this.pageDetails = JSON.parse(localStorage.getItem('AgentPageNo')) || null;
		this.createagentDetailsForm();
		// this.setupId = this.route.snapshot.queryParams.whatsAppSetupId;
		this.agent = this.route.params['_value'];

		if (this.agent && this.agent.AgentId) {
			this.AgentService.getAgentById(this.agent.AgentId).subscribe((res: any) => {
				if (res.success) {
					this.agentDetailsForm.controls['customAssistantId'].enable();
					this.agentDetailsForm.patchValue(res.data);
					this.agentDetailsForm.controls['customAssistantId'].disable();
					this.ClientList = [];
					this.childClientList = [];
					for (let client of res.data.ClientAgentMappings) {
						if (client.mainClient) {
							this.ClientList.push(client.Client);
							this.agentDetailsForm.controls['ClientId'].setValue(client.ClientId);
						} else {
							this.childClientList.push({
								client_id: client.Client.client_id,
								name: client.Client.name,
								isSelected: true,
								id: client.Client.id,
							});
						}
					}
					this.agentDetailsForm.controls['ClientId'].disable();
					this.versionList = res.data.AgentVersions;
				}
			});
		} else {
			this.AgentService.getAllClientWithoutAgentById(this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					this.ClientList = res.data;
				}
			});
		}

		// Disable Some Field In the Form
		this.agentDetailsForm.controls['customAssistantId'].disable();

		this.getAppBranding();
	}

	selectClient() {
		let selectedClientId = this.agentDetailsForm.controls['ClientId'].value;
		if (selectedClientId) {
			this.AgentService.getAllClientWithoutAgentById(selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.childClientList = [];
					this.childClientList = res.data;
				}
			});
		}
	}

	createagentDetailsForm() {
		this.agentDetailsForm = this.formBuilder.group({
			id: null,
			ClientId: [null, Validators.required],
			type: ['OpenAI Assistant API', Validators.required],
			endPointURL: [null],
			customAssistantId: [null],
			customApiKey: [null],
			config: [null],
			assistantName: [null],
			openAISecretKey: [null],
			assistantId: [null],
		});
	}
	get f() {
		return this.agentDetailsForm.controls;
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

	saveAgent() {
		this.agentDetailsForm.enable();
		if (this.agentDetailsForm.invalid) {
			this.markAsTouched(this.agentDetailsForm);
			return;
		}
		let payload = {
			agentDetails: this.agentDetailsForm.value,
			selectedChildClient: this.childClientList,
			versions: this.versionList,
		};

		let flag = false;
		//Add Validation
		if (!payload.agentDetails.type) {
			flag = true;
		} else if (payload.agentDetails.type == 'OpenAI Assistant API') {
			if (payload.agentDetails.openAISecretKey == '' || payload.agentDetails.openAISecretKey == null) {
				this.agentDetailsForm.controls['openAISecretKey'].setErrors({ required: true });
				// console.log('');
				flag = true;
			}
			if (payload.agentDetails.assistantId == '' || payload.agentDetails.assistantId == null) {
				this.agentDetailsForm.controls['assistantId'].setErrors({ required: true });
				// console.log('');

				flag = true;
			}
		} else if (payload.agentDetails.type == 'Drip Custom Agent') {
			if (payload.agentDetails.endPointURL == '' || payload.agentDetails.endPointURL == null) {
				this.agentDetailsForm.controls['endPointURL'].setErrors({ required: true });
				// console.log('');
				flag = true;
			}
			if (payload.agentDetails.customAssistantId == '' || payload.agentDetails.customAssistantId == null) {
				this.agentDetailsForm.controls['customAssistantId'].setErrors({ required: true });
				this.toastr.error(
					this.appService.getTranslation('Pages.Agents.AddEdit.Toaster.createAssistantError'),
					this.appService.getTranslation('Utils.error')
				);
				// console.log('');
				flag = true;
			}
			if (payload.agentDetails.customApiKey == '' || payload.agentDetails.customApiKey == null) {
				this.agentDetailsForm.controls['customApiKey'].setErrors({ required: true });
				// console.log('');
				flag = true;
			}
			if (payload.agentDetails.assistantName == '' || payload.agentDetails.assistantName == null) {
				this.agentDetailsForm.controls['assistantName'].setErrors({ required: true });
				// console.log('');
				flag = true;
			}

			if (this.versionList?.length == 0) {
				flag = true;
			}
		}

		if (flag) {
			return;
		}

		this.spinnerService.show();
		if (this.agentDetailsForm.value.id == null) {
			this.AgentService.createAgent(payload).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.Agents.AddEdit.Toaster.setupcreated'),
						this.appService.getTranslation('Utils.success')
					);
					this.router.navigate(['/agents']);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					this.router.navigate(['/agents']);
				}
			});
		} else {
			this.savePagination();
			this.AgentService.updateAgent(payload, payload.agentDetails.id, this.userClient.id).subscribe((res: any) => {
				if (res.success) {
					this.appService.checkNotifcation = true;
					this.spinnerService.hide();
					this.toastr.success(
						this.appService.getTranslation('Pages.Agents.AddEdit.Toaster.setupupdated'),
						this.appService.getTranslation('Utils.success')
					);
					setTimeout(() => {
						this.router.navigate(['/agents']);
					}, 100);
				} else {
					this.spinnerService.hide();
					this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
					setTimeout(() => {
						this.router.navigate(['/agents']);
					}, 100);
				}
			});
		}
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/whatsapp-setup']);
			}, 100);
		} else {
			this.router.navigate(['/whatsapp-setup']);
		}
	}

	selectAllChildClient() {
		for (let client of this.childClientList) {
			if (this.selecteAllChildClient) {
				client.isSelected = true;
			} else {
				client.isSelected = false;
			}
		}
	}

	changeOneToggle(flag) {
		if (flag == false) {
			this.selecteAllChildClient = false;
		}
		if (flag == true) {
			let flag_ = true;
			for (let client of this.childClientList) {
				if (!client.isSelected) {
					flag_ = false;
				}
			}
			this.selecteAllChildClient = flag_;
		}
	}

	savePagination() {
		// let payload = {
		// 	pageNo: this.pageDetails.pageNo,
		// 	isPageChange: true,
		// };
		// localStorage.setItem('AgentPageNo', JSON.stringify(payload));
	}

	selectType() {
		if (this.agentDetailsForm.controls['type'].value === 'Drip Custom Agent') {
			this.agentDetailsForm.controls['customAssistantId'].disable();
		} else {
			this.agentDetailsForm.controls['customAssistantId'].enable();
		}
	}

	createAssistant() {
		// Validation
		if (
			this.agentDetailsForm.controls['customApiKey'].value &&
			this.agentDetailsForm.controls['endPointURL'].value &&
			this.agentDetailsForm.controls['config'].value
		) {
			//Call Create Assistance Api
			let payload = {
				customApiKey: this.agentDetailsForm.controls['customApiKey'].value,
				endPointURL: this.agentDetailsForm.controls['endPointURL'].value,
				assistantName: this.agentDetailsForm.controls['assistantName'].value,
				config: this.agentDetailsForm.controls['config'].value,
			};
			this.spinnerService.show();
			this.AgentService.createAssistant(payload).subscribe((res: any) => {
				if (res.success) {
					this.agentDetailsForm.controls['customAssistantId'].enable();
					this.agentDetailsForm.controls['customAssistantId'].setValue(res.data.assistant_id);
					this.agentDetailsForm.controls['customAssistantId'].disable();
					this.agentDetailsForm.controls['assistantName'].disable();
					this.getAssistantDetailsAndVersion();
					this.spinnerService.hide();
				}
			});
		} else {
			if (
				this.agentDetailsForm.controls['customApiKey'].value == '' ||
				this.agentDetailsForm.controls['customApiKey'].value == null
			) {
				this.agentDetailsForm.controls['customApiKey'].setErrors({ required: true });
				// console.log('');
			}

			if (
				this.agentDetailsForm.controls['endPointURL'].value == '' ||
				this.agentDetailsForm.controls['endPointURL'].value == null
			) {
				this.agentDetailsForm.controls['endPointURL'].setErrors({ required: true });
				// console.log('');
			}

			if (
				this.agentDetailsForm.controls['config'].value == '' ||
				this.agentDetailsForm.controls['config'].value == null
			) {
				this.agentDetailsForm.controls['config'].setErrors({ required: true });
				// console.log('');
			}

			if (
				this.agentDetailsForm.controls['assistantName'].value == '' ||
				this.agentDetailsForm.controls['assistantName'].value == null
			) {
				this.agentDetailsForm.controls['assistantName'].setErrors({ required: true });
				// console.log('');
			}
		}
	}

	getAssistantDetailsAndVersion() {
		let payload = {
			customApiKey: this.agentDetailsForm.controls['customApiKey'].value,
			endPointURL: this.agentDetailsForm.controls['endPointURL'].value,
			assistanceId: this.agentDetailsForm.controls['customAssistantId'].value,
		};
		this.spinnerService.show();
		this.AgentService.getAssistantDetailsAndAllVersion(payload).subscribe((res: any) => {
			if (res.success) {
				this.versionList = res.data.versions;
				for (let version of this.versionList) {
					if (res.data.assistant.version === version.version) {
						version.default = true;
					} else {
						version.default = false;
					}
					version.disabled = true;
					version.config = JSON.stringify(version.config);
				}
				// console.log('-------this.versionList----------', this.versionList);
			}
			this.spinnerService.hide();
		});
	}
	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}
	copyText(index) {
		// this.configrationData = JSON.stringify(data);
		this.versionList[index].disabled = false;
		let id = '#hyper_link' + this.versionList[index].version;
		setTimeout(() => {
			let textBox = document.querySelector(id) as HTMLInputElement;

			if (!textBox) return;
			textBox.select();
			document.execCommand('copy');
			this.toastr.success(
				this.appService.getTranslation('Pages.Agents.AddEdit.Toaster.copyConfigration'),
				this.appService.getTranslation('Utils.success')
			);
			this.versionList[index].disabled = true;
		}, 200);
	}

	addVersion() {
		$('#addVersion').modal('show');
	}

	cancelDeletePopUp() {
		$('#addVersion').modal('hide');
		this.agentDetailsForm.controls['config'].setValue(null);
	}

	addNewVersion() {
		//Add Validation
		if (
			this.agentDetailsForm.controls['config'].value == '' ||
			this.agentDetailsForm.controls['config'].value == null
		) {
			this.agentDetailsForm.controls['config'].setErrors({ required: true });
			return;
		}
		//Call API
		let payload = {
			customApiKey: this.agentDetailsForm.controls['customApiKey'].value,
			endPointURL: this.agentDetailsForm.controls['endPointURL'].value,
			assistanceId: this.agentDetailsForm.controls['customAssistantId'].value,
			config: this.agentDetailsForm.controls['config'].value,
		};
		this.AgentService.updateAssistant(payload).subscribe((res: any) => {
			if (res.success) {
				this.cancelDeletePopUp();
				this.getAssistantDetailsAndVersion();
			}
		});
	}

	makeActive(item) {
		if (!item.version) {
			let payload = {
				customApiKey: this.agentDetailsForm.controls['customApiKey'].value,
				endPointURL: this.agentDetailsForm.controls['endPointURL'].value,
				assistanceId: this.agentDetailsForm.controls['customAssistantId'].value,
				version: item.version,
			};
			this.spinnerService.show();
			this.AgentService.setDefaultAssistantVersion(payload).subscribe((res: any) => {
				if (res.success) {
					this.spinnerService.hide();
					this.getAssistantDetailsAndVersion();
				}
			});
		}
		return;
	}
}
