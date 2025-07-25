import { Component, Input, OnInit } from '@angular/core';

import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { ActivatedRoute } from '@angular/router';
import { WordCloudService } from './word-cloud.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CloudData, CloudOptions } from 'angular-tag-cloud-module';
import { routerTransition } from '../router.animations';
import { AppService } from '../app.service';

declare var $: any;

@Component({
	selector: 'app-word-cloud',
	templateUrl: './word-cloud.component.html',
	styleUrls: ['./word-cloud.component.css'],
	animations: [routerTransition()],
})
export class WordCloudComponent implements OnInit {
	@Input() id: any;
	@Input() index: any;

	sessionId;
	refreshShowResultIndex: any;
	sessionAllData = [];
	word_cloud = [];

	options: CloudOptions = {
		width: 1,
		height: window.innerHeight,
		overflow: true,
		zoomOnHover: {
			scale: 1.2,
			transitionTime: 0.3,
			delay: 0.3,
		},
		realignOnResize: true,
	};

	data: CloudData[] = [];
	wordCloud = false;
	wordsToEliminate = [
		'a',
		'an',
		'the',
		'about',
		'above',
		'after',
		'at',
		'before',
		'behind',
		'below',
		'beside',
		'between',
		'by',
		'during',
		'for',
		'from',
		'in',
		'inside',
		'into',
		'of',
		'off',
		'on',
		'out',
		'over',
		'through',
		'to',
		'under',
		'with',
		'i',
		'you',
		'he',
		'she',
		'it',
		'we',
		'they',
		'me',
		'him',
		'her',
		'us',
		'them',
		'and',
		'but',
		'or',
		'nor',
		'so',
		'yet',
		'for',
		'is',
		'are',
		'was',
		'were',
		'have',
		'has',
		'had',
		'do',
		'does',
		'did',
	];

	constructor(
		private spinnerService: NgxSpinnerService,
		private toastr: ToastrService,
		private route: ActivatedRoute,
		public appService: AppService,
		private wordCloudService: WordCloudService,
		public sanitizer: DomSanitizer
	) {}

	async ngOnInit() {
		let id;
		let index;
		if (this.index > -1) {
			index = this.index;
		} else {
			index = this.route.snapshot.paramMap.get('index');
		}
		if (this.id) {
			id = this.id;
		} else {
			id = this.route.snapshot.paramMap.get('id');
		}

		// let id = this.route.snapshot.paramMap.get('id');
		// let index = this.route.snapshot.paramMap.get('index');
		if (id) {
			this.sessionId = id;
			this.refreshShowResultIndex = index;
			this.refreshShowResult();
		}
	}

	refreshShowResult() {
		this.spinnerService.show();
		this.wordCloudService.getSessionAllUsersAllData(this.sessionId).subscribe((res: any) => {
			if (res.success) {
				this.sessionAllData = [];
				this.sessionAllData = res.data;
				setTimeout(() => {
					this.showResultPopUp(this.refreshShowResultIndex);
				}, 200);
				this.spinnerService.hide();
			}
		});
	}

	showResultPopUp(index) {
		if (this.sessionAllData && this.sessionAllData.length > 0) {
			this.word_cloud = [];
			for (let workbook of this.sessionAllData) {
				let worksheet = workbook.SessionWorksheets.length > 0 ? workbook.SessionWorksheets[index] : null;
				let questions = [];
				if (worksheet && worksheet.SessionQuestions && worksheet.SessionQuestions.length > 0) {
					questions = worksheet.SessionQuestions.sort((a, b) => {
						if (a.id < b.id) {
							return -1;
						}
					});
				}
				for (let que of questions) {
					if (worksheet.type == 'Word Cloud') {
						for (let option of que.SessionOptions) {
							if (option.userAnswer !== null && option.userAnswer !== '') {
								// let list = option.userAnswer.split(' ');
								// for (let word of list) {
								// 	if (!this.wordsToEliminate.includes(word.toLowerCase())) this.word_cloud.push(word.toLowerCase());
								// }
								let lowerCaseAnswer = option.userAnswer.toLowerCase();
								if (!this.wordsToEliminate.includes(lowerCaseAnswer)) {
									this.word_cloud.push(lowerCaseAnswer);
								}
							}
						}
					}
				}
			}
			if (this.word_cloud.length > 0) {
				this.manageWorkCouldList(this.word_cloud);
			}
		} else {
			this.toastr.warning(
				this.appService.getTranslation('Pages.Session.SessionTimeline.Toaster.noparticipant'),
				this.appService.getTranslation('Utils.warning')
			);
		}
	}

	manageWorkCouldList(list) {
		const colorList = ['#5271FF', '#01BFBD', '#FFBFA4', '#FF66C4', '#D2B5F9', '#215968'];
		let uniqeWordList = [];
		let tempList = [];
		let finalList = [];
		for (let word of list) {
			if (tempList.includes(word)) {
				let index = tempList.indexOf(word);
				uniqeWordList[index].count = uniqeWordList[index].count + 1;
			} else {
				uniqeWordList.push({ text: word, count: 1 });
				tempList.push(word);
			}
		}
		for (let data of uniqeWordList) {
			const per = Math.floor((data.count / uniqeWordList.length) * 100);
			const color = this.randomNumber(1, 6);
			const rotate = this.randomNumber(1, 2);

			let weight = Math.floor(per / 10) + 1;
			// if (data.text.length > 15) weight = Math.max(1, weight - 1); // Reduce weight for long text

			finalList.push({
				text: data.text,
				weight: weight,
				color: colorList[color - 1],
				link: null,
				external: null,
				//rotate: 0,
				rotate: rotate === 1 ? 0 : 90,
			});
		}
		this.data = finalList;
		this.wordCloud = true;
	}

	randomNumber(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}
}
