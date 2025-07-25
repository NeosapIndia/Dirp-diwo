import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ManageAssetsLibraryService } from '../manage-assets-library.service';
import { map, switchMap } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from 'src/app/app.service';
declare var $: any;

@Component({
	selector: 'app-add-edit-assets',
	templateUrl: './add-edit-assets.component.html',
	styleUrls: ['./add-edit-assets.component.css'],
})
export class AddEditAssetsComponent implements OnInit {
	showAssetAtATime = 4;
	showAssetLimit = 5;
	notOwnAnyAssetRoleId = [2, 3, 4, 5];
	clientList = [];
	assetBasePath = environment.imageHost + environment.imagePath;
	assetCategory = [{ name: 'Media' }, { name: 'Link' }];
	selectedAssetCategory: string;
	selectedMediaAssetDetails: any = [];
	selectedClientId: any;
	AssetLinks: any = [];
	userId;
	linkDetails: any;
	updateAssets: any;
	isEdit: boolean = false;
	private data: any;
	public uploadPercent;
	vimeoToken: any;
	vimeoDetails: any;
	notOwnClientDetails: boolean = false;

	vimeoVideoId: any;
	isMultipleSelected: boolean = true;
	userClient;
	isAssetCategorySelected: boolean = false;
	imageSrc: any[] = [];
	ownerClient: { name: any; client_id: any };
	userRoleId: number;
	pageDetails: any;
	type = 'drip';
	whatAppVideo: boolean = false;
	iconObject = {
		add_icon_35: null,
	};
	constructor(
		private AssetLibraryService: ManageAssetsLibraryService,
		private spinnerService: NgxSpinnerService,
		private router: Router,
		private route: ActivatedRoute,
		private toastr: ToastrService,
		public appService: AppService,
		public sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		this.type = this.appService.type;
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id || null;
		this.pageDetails = JSON.parse(localStorage.getItem('assetPageNo')) || null;
		this.updateAssets = this.route.params['_value'];
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		if (this.updateAssets && this.updateAssets.assetId) {
			this.isEdit = true;
			this.getAssetByAssetId(this.updateAssets.assetId);
		} else {
			if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
				this.AssetLibraryService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
					if (res.success) {
						this.selectedClientId = null;
						this.clientList = [];
						this.clientList = res.data;
						$('#selecteClientList').modal('show');
					}
				});
			}
		}
		this.addMoreLinks();
		this.getVimeoToken();
		this.getAppBranding();
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}
	transform(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
	getAssetByAssetId(assetId) {
		this.AssetLibraryService.getAssetByAssetId(assetId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.Asset_details && res.data.Asset_details[0].vmoVideoId) {
					this.vimeoVideoId = res.data.Asset_details[0].vmoVideoId;
				}
				if (res.data.field_name == 'Link') {
					this.selectedAssetCategory = 'Link';
					let payload = {
						title: res.data.title,
						tagName: res.data.tagName,
						description: res.data.description,
						type: 'Link',
						path: res.data.Asset_details[0].path,
						selfHostedVideo: res.data.selfHostedVideo,
					};
					this.AssetLinks = [];
					this.AssetLinks.push(payload);
				} else {
					this.selectedAssetCategory = 'Media';
					this.whatAppVideo = false;
					let payload;
					if (res.data.field_name == 'Image') {
						payload = {
							title: res.data.title,
							tagName: res.data.tagName,
							description: res.data.description,
							type: res.data.field_name,
							path: res.data.Asset_details[0].path,
							Preview: [],
						};
					} else if (res.data.field_name == 'Video') {
						payload = {
							title: res.data.title,
							tagName: res.data.tagName,
							description: res.data.description,
							type: res.data.field_name,
							path: res.data.Asset_details[0].path,
							Preview: [],
							isTranscoding: res.data.Asset_details[0].isTranscoding,
						};
					} else if (res.data.field_name == 'Whatsapp Video') {
						this.whatAppVideo = true;
						payload = {
							title: res.data.title,
							tagName: res.data.tagName,
							description: res.data.description,
							type: 'WhatsappVideo',
							path: res.data.Asset_details[0].path,
							Preview: [],
						};
					} else {
						payload = {
							title: res.data.title,
							tagName: res.data.tagName,
							description: res.data.description,
							type: res.data.field_name,
						};
					}
					if (res.data.field_name == 'Video' || res.data.field_name == 'Whatsapp Video') {
						this.isMultipleSelected = false;
					}
					this.selectedMediaAssetDetails.push(payload);
				}

				if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
					this.AssetLibraryService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((_res: any) => {
						if (_res.success) {
							this.selectedClientId = res.data.ClientId;
							this.selectedClientId = null;
							for (let client of _res.data) {
								if (client.id == res.data.ClientId) {
									this.ownerClient = { client_id: client.client_id, name: client.name };
								}
							}
						}
					});
				}
			}
		});
	}
	changeAssetCategory(event) {
		this.isAssetCategorySelected = false;
		this.selectedAssetCategory = event.name;
		if (this.selectedAssetCategory == 'Link') {
			this.linkDetails = {
				title: null,
				tagName: null,
				description: null,
				type: 'Link',
				path: null,
			};
		}
	}

	uploadMedia(event, assetType) {
		if (event.target && event.target.files && event.target.files.length > 0) {
			for (let media of event.target.files) {
				let fileName = media.name;
				let mediaType = media.type;

				fileName = fileName.replace('.pdf', '').replace('.png', '').replace('.jpg', '').replace('.mp4', '');
				if (mediaType.includes('pdf')) {
					mediaType = 'PDF';
				} else if (mediaType.includes('image')) {
					mediaType = 'Image';
				} else if (mediaType.includes('video') && assetType == 'thumbnail') {
					mediaType = 'Video';
				} else if (mediaType.includes('video') && assetType == 'whatappvideo') {
					mediaType = 'WhatsappVideo';
				}
				let payload = {
					title: fileName,
					tagName: '',
					description: '',
					type: mediaType,
					otherDetails: media,
					AssetTitleError: false,
					Preview: [],
					isTranscoding: false,
				};
				if (this.updateAssets && this.updateAssets.assetId) {
					if (this.selectedMediaAssetDetails[0].type == 'Video') {
						this.selectedMediaAssetDetails = [];
					}
				}

				const file = media;
				const reader = new FileReader();
				reader.onload = (e) => payload.Preview.push(reader.result);
				reader.readAsDataURL(file);

				if (mediaType == 'Image' && media.size >= 2097152) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.maximage2MB'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (mediaType == 'PDF' && media.size >= 5242880) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.maximage5MB'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (mediaType == 'WhatsappVideo' && media.size >= 15938355.2) {
					this.toastr.error(
						this.appService.getTranslation('Pages.Drips.AddEdit.Toaster.maxvideo15.2MB'),
						this.appService.getTranslation('Utils.error')
					);
				} else {
					this.selectedMediaAssetDetails.push(payload);
				}
			}
		}
	}

	addMoreLinks() {
		let flag = false;
		for (let item of this.AssetLinks) {
			if (item.title == '' || item.title == null) {
				flag = true;
				item.AssetTitleError = true;
			}
			if (item.path == '' || item.path == null) {
				flag = true;
				item.UploadLinkError = true;
			}
		}
		if (!flag) {
			let payload = {
				id: null,
				title: null,
				tagName: null,
				description: null,
				path: null,
				originalname: null,
				type: 'Link',
				AssetTitleError: false,
				UploadValidLinkError: false,
				UploadLinkError: false,
				selfHostedVideo: false,
			};
			this.AssetLinks.push(payload);
		}
	}

	removeAssetLinks(index) {
		this.AssetLinks.splice(index, 1);
	}

	getVimeoToken() {
		this.AssetLibraryService.getvimeoToken(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				this.vimeoDetails = res.data;
			}
		});
	}

	checkMediaAssetTitle(index, char) {
		if (char.length == 0) {
			this.selectedMediaAssetDetails[index].AssetTitleError = true;
		} else {
			this.selectedMediaAssetDetails[index].AssetTitleError = false;
		}
	}

	checkLinkAssetTitle(index, char) {
		if (char.length == 0) {
			this.AssetLinks[index].AssetTitleError = true;
		} else {
			this.AssetLinks[index].AssetTitleError = false;
		}
	}

	checkUploadlink(index, char) {
		if (char.length == 0) {
			this.AssetLinks[index].UploadLinkError = true;
		} else {
			this.AssetLinks[index].UploadLinkError = false;
		}
		if (char.toLowerCase().indexOf('http') == 0) {
			this.AssetLinks[index].uploadValidLinkError = false;
		} else {
			this.AssetLinks[index].uploadValidLinkError = true;
		}

		if (this.AssetLinks[index].selfHostedVideo == true) {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);
			if (!char.match(youtubeRegEx)) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}
	}

	saveAsset() {
		if (this.selectedAssetCategory === undefined || this.selectedAssetCategory === null) {
			this.isAssetCategorySelected = true;
			this.spinnerService.hide();
			return;
		}
		if (this.selectedAssetCategory == 'Media') {
			if (
				this.selectedMediaAssetDetails == null ||
				this.selectedMediaAssetDetails == undefined ||
				this.selectedMediaAssetDetails.length == 0
			) {
				this.toastr.error(
					this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadassests'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		if (this.selectedAssetCategory == 'Media') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.title == '' || asset.title == null) {
					asset.AssetTitleError = true;
					return;
				}
			}
		}

		if (this.selectedAssetCategory == 'Link') {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);

			for (let link of this.AssetLinks) {
				if (
					link.title == '' ||
					link.title == null ||
					link.path == '' ||
					link.path == null ||
					link.path.toLowerCase().indexOf('http') != 0 ||
					(link.selfHostedVideo == true && !link.path.match(youtubeRegEx))
				) {
					if (link.title == '' || link.title == null) {
						link.AssetTitleError = true;
					}
					if (link.path.toLowerCase().indexOf('http') != 0) {
						link.UploadValidLinkError = true;
					}
					if (link.path == '' || link.path == null) {
						link.UploadLinkError = true;
					}

					if (link.selfHostedVideo == true && !link.path.match(youtubeRegEx)) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
							this.appService.getTranslation('Utils.error')
						);
					}

					return;
				}
			}
		}

		if (this.selectedAssetCategory == 'Media') {
			let index = 0;
			let errorFlag = false;
			this.spinnerService.show();
			for (let asset of this.selectedMediaAssetDetails) {
				// For WhatsApp Video
				if (asset.type == 'WhatsappVideo') {
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							uploadData.append(asset.type, asset[key]);
						} else {
							if (key != 'Preview') {
								uploadData.append(key, asset[key]);
							}
						}
					}

					this.spinnerService.show();

					let count = 0;
					if (index == this.selectedMediaAssetDetails.length - 1) {
						count = this.selectedMediaAssetDetails.length;
					}
					this.AssetLibraryService.createAsset(uploadData, this.selectedClientId, count).subscribe((res: any) => {
						if (res.success) {
							if (count) {
								this.spinnerService.hide();
							}
						} else {
							errorFlag = true;
							this.spinnerService.hide();
						}
					});
				} else if (asset.type == 'Video') {
					////////////////////////////////////////////////////////////////////////////////////////
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							uploadData.append(asset.type, asset[key]);
						} else {
							if (key != 'Preview') {
								uploadData.append(key, asset[key]);
							}
						}
					}

					this.spinnerService.show();
					if (this.appService?.configurable_feature?.mediaCMS) {
						this.AssetLibraryService.canUploadVideoOnMediaCMS().subscribe((res: any) => {
							if (res.success) {
								if (res.canUpload) {
									this.AssetLibraryService.uploadVideoOnMediaCMS(uploadData, this.selectedClientId).subscribe(
										(res: any) => {
											if (res) {
												asset.cmsVideoId = res.data.videoId;
												asset.size = res.data.size;
												const uploadData = new FormData();
												for (var key in asset) {
													if (key == 'otherDetails') {
														if (asset.type != 'Video') {
															uploadData.append(asset.type, asset[key]);
														}
													} else {
														if (key != 'Preview') {
															uploadData.append(key, asset[key]);
														}
													}
												}

												this.AssetLibraryService.createAsset(uploadData, this.selectedClientId, 1).subscribe(
													(res: any) => {
														if (res.success) {
															//Call Preset APi
															this.appService.checkNotifcation = true;
															// this.spinnerService.hide();
														} else {
															errorFlag = true;
															// this.spinnerService.hide();
														}
													}
												);
											}
										}
									);
								} else {
									this.toastr.error(
										this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
										this.appService.getTranslation('Utils.error')
									);
								}
							} else {
								this.toastr.error(
									this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
									this.appService.getTranslation('Utils.error')
								);
							}
						});
					} else if (this.appService?.configurable_feature?.vimeo) {
						asset.data = null;
						const options = {
							token: this.vimeoDetails.vToken,
							url: environment.VimeoUploadApi,
							videoName: asset.title,
							videoDescription: asset.description,
						};
						if (this.vimeoDetails == false) {
							this.toastr.error(
								this.appService.getTranslation('Utils.novimeocredentials'),
								this.appService.getTranslation('Utils.error')
							);
							return;
						}

						this.AssetLibraryService.createVimeo(options, asset.otherDetails.size)
							.pipe(
								map((data) => (asset.data = data)),
								switchMap(() => {
									this.appService.checkNotifcation = true;
									this.AssetLibraryService.updateVimeoLink(asset.data.link);
									if (asset.data.upload.size === asset.otherDetails.size) {
										return this.AssetLibraryService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
									}
								})
							)
							.subscribe(
								(event) => {
									if (event.type === HttpEventType.UploadProgress) {
										this.uploadPercent = Math.round((100 * event.loaded) / event.total);
									} else if (event instanceof HttpResponse) {
										let vmoVideoId = this.getVimeoUserIdFromUrl(asset.data.uri);
										asset.vimeoPath = asset.data.player_embed_url;
										asset.vmoVideoId = vmoVideoId;
										asset.size = asset.otherDetails.size;
										const uploadData = new FormData();
										for (var key in asset) {
											if (key == 'otherDetails') {
												if (asset.type != 'Video') {
													uploadData.append(asset.type, asset[key]);
												}
											} else {
												if (key != 'Preview') {
													uploadData.append(key, asset[key]);
												}
											}
										}

										this.AssetLibraryService.createAsset(uploadData, this.selectedClientId, 1).subscribe((res: any) => {
											if (res.success) {
												//Call Preset APi
												const options = {
													token: this.vimeoDetails.vToken,
													url: environment.VimeoPresetApi,
													presetId: this.vimeoDetails.presetId,
													videoId: asset.vmoVideoId,
												};
												this.AssetLibraryService.applyEmbedPreset(options).subscribe((res: any) => {
													console.log('---Res---', res.data);
												});
												this.appService.checkNotifcation = true;
												// this.spinnerService.hide();
											} else {
												errorFlag = true;
												// this.spinnerService.hide();
											}
										});
									}
								},
								(error) => {
									console.log('Upload Error:', error);
								},
								() => {
									console.log('Upload done');
								}
							);
					}

					////////////////////////////////////////////////////////////////////////////////////////
				} else {
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							if (asset.type != 'Video') {
								uploadData.append(asset.type, asset[key]);
							}
						} else {
							if (key != 'Preview') {
								uploadData.append(key, asset[key]);
							}
						}
					}
					this.spinnerService.show();

					let count = 0;
					if (index == this.selectedMediaAssetDetails.length - 1) {
						count = this.selectedMediaAssetDetails.length;
					}
					this.AssetLibraryService.createAsset(uploadData, this.selectedClientId, count).subscribe((res: any) => {
						if (res.success) {
							if (count) {
								this.spinnerService.hide();
							}
						} else {
							errorFlag = true;
							this.spinnerService.hide();
						}
					});
				}
				index++;
				if (index >= this.selectedMediaAssetDetails.length) {
					if (!errorFlag) {
						this.spinnerService.hide();
						this.appService.checkNotifcation = true;

						if (asset.type == 'Video') {
							this.toastr.success(
								this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.videoassetscreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
								this.appService.getTranslation('Utils.success')
							);
						}
						this.router.navigate(['assets-library']);
					}
				}
			}
		} else if (this.selectedAssetCategory == 'Link') {
			for (let asset of this.AssetLinks) {
				this.spinnerService.show();
				this.AssetLibraryService.createAsset(asset, this.selectedClientId, 1).subscribe((res: any) => {
					if (res.success) {
					} else {
						this.spinnerService.hide();
					}
				});
			}
			this.appService.checkNotifcation = true;
			this.spinnerService.hide();
			this.toastr.success(
				this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetscreated'),
				this.appService.getTranslation('Utils.success')
			);
			this.router.navigate(['assets-library']);
		}
	}

	getVimeoUserIdFromUrl(url) {
		const parts = url.split('/');
		return parts.at(-1);
	}

	updateAsset() {
		this.savePagination();
		if (this.selectedAssetCategory == 'Media') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.title == '' || asset.title == null) {
					asset.AssetTitleError = true;
					return;
				}
			}
		}

		if (this.selectedAssetCategory == 'Link') {
			const youtubeRegEx = new RegExp(
				/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
			);

			for (let link of this.AssetLinks) {
				if (
					link.title == '' ||
					link.title == null ||
					link.path == '' ||
					link.path == null ||
					(link.selfHostedVideo == true && !link.path.match(youtubeRegEx))
				) {
					if (link.title == '' || link.title == null) {
						link.AssetTitleError = true;
					}
					if (link.path == '' || link.path == null) {
						link.UploadLinkError = true;
					}

					if (link.selfHostedVideo == true && !link.path.match(youtubeRegEx)) {
						this.toastr.error(
							this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.uploadyoutubeVideo'),
							this.appService.getTranslation('Utils.error')
						);
					}

					return;
				}
			}
		}

		this.spinnerService.show();
		if (this.selectedAssetCategory == 'Media') {
			for (let asset of this.selectedMediaAssetDetails) {
				if (asset.type == 'Video') {
					this.spinnerService.show();
					if (asset && asset.otherDetails) {
						this.spinnerService.show();
						if (this.appService?.configurable_feature?.mediaCMS) {
							////////////////////////////////////////////////////////////////////////////////////////
							const uploadData = new FormData();
							for (var key in asset) {
								if (key == 'otherDetails') {
									uploadData.append(asset.type, asset[key]);
								} else {
									if (key != 'Preview') {
										uploadData.append(key, asset[key]);
									}
								}
							}

							this.AssetLibraryService.canUploadVideoOnMediaCMS().subscribe((res: any) => {
								if (res.success) {
									if (res.canUpload) {
										this.AssetLibraryService.uploadVideoOnMediaCMS(uploadData, this.selectedClientId).subscribe(
											(res: any) => {
												if (res) {
													asset.cmsVideoId = res.data.videoId;
													asset.size = res.data.size;
													const uploadData = new FormData();
													for (var key in asset) {
														if (key == 'otherDetails') {
															if (asset.type != 'Video') {
																uploadData.append(asset.type, asset[key]);
															}
														} else {
															if (key != 'Preview') {
																uploadData.append(key, asset[key]);
															}
														}
													}

													this.AssetLibraryService.updateAsset(
														uploadData,
														this.updateAssets.assetId,
														this.selectedClientId
													).subscribe((res: any) => {
														if (res.success) {
															this.appService.checkNotifcation = true;
															this.toastr.success(
																this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
																this.appService.getTranslation('Utils.success')
															);
															this.spinnerService.hide();
															setTimeout(() => {
																this.router.navigate(['assets-library']);
															}, 100);
														} else {
															this.spinnerService.hide();
														}
													});
												}
											}
										);
									} else {
										this.toastr.error(
											this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
											this.appService.getTranslation('Utils.error')
										);
									}
								} else {
									this.toastr.error(
										this.appService.getTranslation('Pages.Workbook.AddEdit.diskfullTranscodingVideoText'),
										this.appService.getTranslation('Utils.error')
									);
								}
							});
						} else if (this.appService?.configurable_feature?.vimeo) {
							asset.data = null;
							const options = {
								token: this.vimeoDetails.vToken,
								url: environment.VimeoUploadApi,
								videoName: asset.title,
								videoDescription: asset.description,
							};
							if (this.vimeoDetails == false) {
								this.toastr.error(
									this.appService.getTranslation('Utils.novimeocredentials'),
									this.appService.getTranslation('Utils.error')
								);
								return;
							}

							this.AssetLibraryService.createVimeo(options, asset.otherDetails.size)
								.pipe(
									map((data) => (asset.data = data)),
									switchMap(() => {
										this.AssetLibraryService.updateVimeoLink(asset.data.link);
										if (asset.data.upload.size === asset.otherDetails.size) {
											return this.AssetLibraryService.vimeoUpload(asset.data.upload.upload_link, asset.otherDetails);
										}
									})
								)
								.subscribe(
									(event) => {
										if (event.type === HttpEventType.UploadProgress) {
											this.uploadPercent = Math.round((100 * event.loaded) / event.total);
										} else if (event instanceof HttpResponse) {
											let vmoVideoId = this.getVimeoUserIdFromUrl(asset.data.uri);
											asset.vimeoPath = asset.data.player_embed_url;
											asset.vmoVideoId = vmoVideoId;
											asset.size = asset.otherDetails.size;
											const uploadData = new FormData();
											for (var key in asset) {
												if (key == 'otherDetails') {
													if (asset.type != 'Video') {
														uploadData.append(asset.type, asset[key]);
													}
												} else {
													if (key != 'Preview') {
														uploadData.append(key, asset[key]);
													}
												}
											}
											this.AssetLibraryService.updateAsset(
												uploadData,
												this.updateAssets.assetId,
												this.selectedClientId
											).subscribe((res: any) => {
												if (res.success) {
													this.appService.checkNotifcation = true;
													if (asset.type == 'Video') {
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.videoassetscreated'),
															this.appService.getTranslation('Utils.success')
														);
													} else {
														this.toastr.success(
															this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
															this.appService.getTranslation('Utils.success')
														);
													}

													this.spinnerService.hide();
													setTimeout(() => {
														this.router.navigate(['assets-library']);
													}, 100);
												} else {
													this.spinnerService.hide();
												}
											});
										}
									},
									(error) => {
										console.log('Upload Error:', error);
									},
									() => {
										console.log('Upload done');
									}
								);
						}
					} else {
						const uploadData = new FormData();
						for (var key in asset) {
							if (key != 'otherDetails') {
								uploadData.append(key, asset[key]);
							}
						}
						this.AssetLibraryService.updateAsset(
							uploadData,
							this.updateAssets.assetId,
							this.selectedClientId
						).subscribe((res: any) => {
							if (res.success) {
								this.appService.checkNotifcation = true;
								this.toastr.success(
									this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
									this.appService.getTranslation('Utils.success')
								);
								this.spinnerService.hide();
								setTimeout(() => {
									this.router.navigate(['assets-library']);
								}, 100);
							} else {
								this.spinnerService.hide();
							}
						});
					}
				} else {
					const uploadData = new FormData();
					for (var key in asset) {
						if (key == 'otherDetails') {
							if (asset.type != 'Video') {
								uploadData.append(asset.type, asset[key]);
							}
						} else {
							if (key != 'Preview') {
								uploadData.append(key, asset[key]);
							}
						}
					}
					this.AssetLibraryService.updateAsset(uploadData, this.updateAssets.assetId, this.selectedClientId).subscribe(
						(res: any) => {
							if (res.success) {
								this.appService.checkNotifcation = true;
								this.toastr.success(
									this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
									this.appService.getTranslation('Utils.success')
								);
								this.spinnerService.hide();
								setTimeout(() => {
									this.router.navigate(['assets-library']);
								}, 100);
							} else {
								this.spinnerService.hide();
							}
						}
					);
				}
			}
		} else if (this.selectedAssetCategory == 'Link') {
			for (let asset of this.AssetLinks) {
				this.AssetLibraryService.updateAsset(asset, this.updateAssets.assetId, this.selectedClientId).subscribe(
					(res: any) => {
						if (res.success) {
							this.spinnerService.hide();
							this.appService.checkNotifcation = true;
							this.toastr.success(
								this.appService.getTranslation('Pages.Assets.AddEdit.Toaster.assetsupdated'),
								this.appService.getTranslation('Utils.success')
							);
							setTimeout(() => {
								this.router.navigate(['assets-library']);
							}, 100);
						} else {
							this.spinnerService.hide();
						}
					}
				);
			}
		}
	}

	removeAsset(index) {
		this.selectedMediaAssetDetails.splice(index, 1);
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('assetPageNo', JSON.stringify(payload));
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['assets-library']);
			}, 100);
		} else {
			this.router.navigate(['assets-library']);
		}
	}

	pathExcel(event) {
		let file = event.target.files[0];
		if (file) {
			this.spinnerService.show();
			const uploadData = new FormData();
			uploadData.append('file', file);
			this.appService
				.uploadLinkAssetInBulk(uploadData, this.userId, this.selectedClientId)
				.toPromise()
				.then(
					(res: any) => {
						this.spinnerService.hide();
						this.toastr.success(
							this.appService.getTranslation('Pages.Assets.AddEdit.UploadYourLink.bulkcreatedlinkAsset'),
							this.appService.getTranslation('Utils.success')
						);
						// this.getClientAllLearner(this.userClientId, this.page, this.limit);
						this.router.navigate(['assets-library']);
						setTimeout(() => {
							this.appService.checkNotifcation = true;
						}, 5000);
					},
					(failed) => {
						this.toastr.error(
							this.appService.getTranslation('Utils.somthingwentwrong'),
							this.appService.getTranslation('Utils.error')
						);
						console.log('Rejected', failed);
						this.spinnerService.hide();
						this.router.navigate(['assets-library']);
					}
				)
				.catch((err) => {
					console.log('Caught error', err);
					this.spinnerService.hide();
				});
		} else {
			this.toastr.error(this.appService.getTranslation('Utils.invalidfile'));
		}
	}

	addAssetFile() {}

	selectClient() {
		if (this.selectedClientId) {
			$('#selecteClientList').modal('hide');
		}
	}
	selctedClient(event) {
		this.ownerClient = {
			name: event.name,
			client_id: event.client_id,
		};
		this.getVimeoToken();
	}

	showMore() {
		this.showAssetAtATime = this.showAssetAtATime + this.showAssetLimit;
	}

	cancelClientlistPopUp() {
		this.router.navigate(['assets-library']);
	}
}
