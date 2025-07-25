import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { AppService } from 'src/app/app.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { map, switchMap } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
declare var $: any;

@Component({
	selector: 'app-land-rover',
	templateUrl: './land-rover.component.html',
	styleUrls: ['./land-rover.component.scss'],
})
export class LandRoverComponent implements OnInit {
	dripForm: any;
	emailNoneNativeForm: any;
	selectedDripType: number;
	type = 'drip';
	dripTypeList: { name: string; type: number; label: any }[];
	blockList: any = [];

	constructor(
		private formBuilder: FormBuilder,

		public appService: AppService,

		public sanitizer: DomSanitizer
	) {
		this.dripTypeList = [
			{
				name: 'Only WhatsApp',
				type: 1,
				label: 'Only WhatsApp',
			},
			{
				name: 'DripApp with sharing on WhatsApp',
				type: 2,
				label: 'DripApp with sharing on WhatsApp',
			},
			{
				name: 'DripApp with sharing on Email',
				type: 3,
				label: 'DripApp with sharing on Email',
			},
			{
				name: 'Only DripApp',
				type: 4,
				label: 'Only DripApp',
			},
			{
				name: 'Email Newsletter',
				type: 5,
				label: 'Email Newsletter',
			},
		];
	}

	ngOnInit() {
		this.createDripForm();
		this.createEmailNonNativeForm();
		this.addMoreBlocks();
	}

	createDripForm() {
		this.dripForm = this.formBuilder.group({
			id: null,
			drip_title: ['', [Validators.required]],
			drip_type: [null, [Validators.required]],
			drip_description: [''],
			drip_status: ['Published', [Validators.required]],
			requiredLogging: [false, [Validators.required]],
			externalLinkFlag: [false],
			externalLinkLabel: [null],
			externalLink: [null],
			showBackButton: [true],
		});
	}
	get dripF() {
		return this.dripForm.controls;
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

	selectDripType(type) {
		if (type) {
			this.selectedDripType = type.type;
		}
	}

	createEmailNonNativeForm() {
		this.emailNoneNativeForm = this.formBuilder.group({
			id: null,
			email_subject_line: ['THE VAULT'],
			email_body: ['Untold Stories. Unearthed Experiences. A Peak into our future.'],
			callToActionText: [null],
			hyper_link: [null],
			contentType: ['Create New Drip'],
		});
	}
	get f3() {
		return this.emailNoneNativeForm.controls;
	}

	addMoreBlocks() {
		let payload;
		if (this.blockList.length == 0) {
			payload = {
				blockImage: 'assets/images/landrover/blog-1.avif',
				headerText: 'DEFENDED JOURNEYS: TRAVEL. FROM A UNIQUE PERSPECTIVE.',
				headerDescription:
					"Behind the wheel of Defender, a world of possibility becomes a lifetime of stories. For those who yearn to travel differently, we have journeys like no other, where you will uncover sights and sounds that will stay with you forever. This is the self-drive adventure of a lifetime. Do the exceptional with Defender. Experience the splendour of Sub-Saharan Africa through your choice of four intrepid itineraries. Home to majestic wildlife, immense deserts, and iconic waterfalls, the ever-changing landscape of Sub-Saharan Africa offers a world of unforgettable experiences. From the surreal landscapes and famous national parks of Namibia to the vibrant lagoons and lush game reserves of Botswana, you will explore some of the world's greatest national wonders and encounter breathtaking wildlife along the way.",
				callToAction: 'Book now..',
				hyper_link: 'https://www.landrover.com/experiences/adventure-travel/sub-sahara-africa/index.html',
			};
		}

		if (this.blockList.length == 1) {
			payload = {
				blockImage: 'assets/images/landrover/blog-2.avif',
				headerText: 'YOUR CHOICE OF POWER!',
				headerDescription:
					" Did you know the way you drive, where you drive and how far you drive can all have a big impact on your vehicle's performance and efficiency? For instance, regular commuting in stop-start city traffic will typically benefit from a different kind of power to regular journeys on motorways or frequent towing. Here we can help you find the right fit for your driving needs. Electric vehicles are powered by an electric motor and a battery. Instead of fuelling up at a petrol station you keep your car charged through a home charging point. Plug-in electric hybrid vehicles (PHEV) combine a petrol engine and an electric motor, meaning a home charging point is optional. Mild electric hybrid vehicles (MHEV) require no charging. They enhance the efficiency of their engines by reusing energy collected through deceleration and regenerative braking. Answer five quick questions about your driving habits to see what kind of electric vehicle is right for you. ",
				callToAction: 'Click to begin',
				hyper_link: 'https://www.landrover.com/electric/your-choice-of-power.html',
			};
		}
		if (this.blockList.length == 2) {
			payload = {
				blockImage: 'assets/images/landrover/blog-3.avif',
				headerText: 'BRANCHING OUT - THE STORY OF ERIN TRUE.',
				headerDescription:
					"Meet Range Rover Sports Owner Erin True. She reclaims wood from demolition and historical sites and repurposes it into beautiful furniture. 'I did not plan to be a furniture maker. It happened by accident,' says Erin True, founder and owner of Urban Wood Goods. Surrounded by tons of reclaimed lumber soon to be turned into tables in her 12,000-square-foot Chicago warehouse, it's hard to imagine how impressive her purposeful actions could be. 'To me, my Range Rover represents luxury, craftsmanship and quality. It's what I aspire for my brand to be.' 'Erin True, Founder and Owner of Urban Wood Goods'.",
				callToAction: 'Read her full story here',
				hyper_link: 'https://www.landroverusa.com/ownership/wellstoried/erin-true.html',
			};
		}

		this.blockList.push(payload);
	}

	removeBlocks(index) {
		this.blockList.splice(index, 1);
	}
}
