const {
	Op,
	sequelize,
	Post,
	Post_detail,
	Post_header,
	Post_header_mapping,
	Campaign,
	User,
	Role,
	User_group,
	User_role_client_mapping,
	User_group_mapping,
	Asset,
	Asset_detail,
	Post_asset_mapping,
	Client,
	Client_job_role,
	Drip_native,
	Drip_whatsapp_native,
	Drip_email_non_native,
	Drip_whatsapp_non_native,
	Drip_camp,
	Market,
	Worksheet,
	Workbook,
	Scorm_tracking,
	Scorm_interaction,
	Option,
	Course,
	Question,
	DiwoAsset,
	Course_workbook_mapping,
	WorkbookUserGroupMapping,
	WorkbookTrainerMapping,
	SessionUser,
	SessionAsset,
	Session,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	DiwoModule,
	Badge,
	Certificate,
	SessionWorksheet,
	SessionQuestion,
	SessionOption,
	MediaCMSUploadQueue,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const sharp = require('sharp');
const Sequelize = require('sequelize');
const {
	getValidationForAssignWorkbook,
	getRemoveWorkbookByCount,
	getAddOneWorkbookInLicense,
} = require('../services/license.service');

const { createNotificationforDiwo, getAllDiwoUserIdsForNotification } = require('../services/notification.service');
const { updateCourseAndPathwayStatus } = require('../services/diwo-assignment.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');
const config_feature = require('../config/SiteConfig.json');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const targetBaseUrl = CONFIG.web_host + '/#/';

const platform = process.platform;
const isWin = platform.includes('win');
const { JSDOM } = require('jsdom');
const { window } = new JSDOM('', { pretendToBeVisual: true });
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js', platform: process.platform };
global.DOMMatrix = require('canvas').DOMMatrix || require('dommatrix');
global.window.requestAnimationFrame =
	global.window.requestAnimationFrame ||
	function (callback) {
		return setTimeout(callback, 0);
	};
global.window.cancelAnimationFrame =
	global.window.cancelAnimationFrame ||
	function (id) {
		clearTimeout(id);
	};
var pdf2img = require('pdf-img-convert');

const shortid = require('shortid');
var fs = require('fs');

const {
	getAllSubChildClientIdsForDiwo,
	getAllSubChildClientIdsForDrip,
	getAllSubClientAndBranchAccountLists,
} = require('../services/client.service');

const { getDiwoClientVimeoTokenService } = require('../services/vimeo.service');
const { notificationEmail, sendModalAssignEmailToTrainer } = require('../services/mailer.service');

const { getClientAppBrandingByClientId, getDiwoClientAppBrandingByClientId } = require('../services/client.service');
const axios = require('axios');
const { createlog } = require('../services/log.service');
const xlsxtojson = require('xlsx-to-json-lc');
const { checkProjectNameByType, checkClientIdAccess, containsDangerousChars } = require('../services/auth.service');
const AdmZip = require('adm-zip');
const path = require('path');
const xml2js = require('xml2js');
const unzipper = require('unzipper');     


// Upload Diwo Assets
const uploadDiwoAsset = async function (req, res) {
	try {
		if (req.body.files) {
			console.log('req.body.files', req.body.files);
			req.files = req.body.files;
			delete req.body.files;
		}
		req.files.media_path = 'uploads/diwo_assets/';

		return ResponseSuccess(res, {
			data: req.files,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadDiwoAsset = uploadDiwoAsset;


/* Validate ZIP for bomb / traversal / nesting issues.*/ 
async function validateZipSafe(zipPath) {
  const directory = await unzipper.Open.file(zipPath);

  let totalSize = 0;
  let fileCount = 0;

  for (const f of directory.files) {
    //directory traversal
    if (f.path.includes('..')) {
      	throw new Error(`Unsafe path: ${f.path}`);
    }

    //nesting depth limiter
    const depth = f.path.split('/').length - 1;		    
	
	if (depth > Number(CONFIG.max_nested_depth_file_in_unzipped_scorm_file)) {
		const limit = CONFIG.max_nested_depth_file_in_unzipped_scorm_file;
		throw new Error(MESSAGE.EXCESSIVE_FOLDER_DEPTH(limit));
	}

    if (f.type === 'File') {
		totalSize  += f.uncompressedSize;
		fileCount++;
		
		console.log('fileCount', fileCount);
		console.log('totalSize', totalSize);

	  	if (fileCount > Number(CONFIG.max_file_count_in_unzipped_scorm_file)) {
			throw new Error(MESSAGE.TOO_MANY_FILES(CONFIG.max_file_count_in_unzipped_scorm_file));
		}

		if (totalSize > Number(CONFIG.max_size_of_unzipped_scorm_file)) {
			throw new Error(MESSAGE.UNCOMPRESSED_SIZE_EXCEEDED(CONFIG.max_size_of_unzipped_scorm_file));
		}

    }
  }
}

const uploadExtractZipDiwoAsset = async function (req, res) {
  try {
    //............................ Step 1: normalize req.files ........................ //
    if (req.body.files) {
      req.files = req.body.files;
      delete req.body.files;
    }
    req.files.media_path = 'uploads/scorm_modules/';

    const uploadedFile = req.files?.scormPackage?.[0];
    if (!uploadedFile || !uploadedFile.originalname.endsWith('.zip')) {
      return ResponseError(res, MESSAGE.INVALID_OR_MISSING_ZIP, 400);
    }

    const zipFileName   = path.basename(uploadedFile.originalname, '.zip');
    const relZipPath    = path.join('uploads/uploads/scorm_modules/', uploadedFile.filename);
    const absoluteZipPath = path.join('public', relZipPath);

    //............................ Step 2: zipbomb safety scan ........................ //
    try {
      await validateZipSafe(absoluteZipPath);           
    } catch (scanErr) {
      fs.unlinkSync(absoluteZipPath); 	           
      return ResponseError(res, scanErr, 400);  
    }

    //............................ Step 3: Extraction with validation if imsmanifest ........................ //
    const zipBuffer = fs.readFileSync(absoluteZipPath);
    const zip       = new AdmZip(zipBuffer);
    const entries   = zip.getEntries();

    // locate imsmanifest.xml
    const manifestEntry = entries.find(e =>
      e.entryName.toLowerCase().endsWith('imsmanifest.xml')
    );
    if (!manifestEntry) {
      fs.unlinkSync(absoluteZipPath);
      return ResponseError(res, { message: MESSAGE.INVALID_SCORM_PACKAGE }, 400);
    }

    // extract to target folder (unchanged)
    const extractBase = path.join(CONFIG.imagePath, 'uploads/scorm_modules', zipFileName);
    fs.mkdirSync(extractBase, { recursive: true });
    zip.extractAllTo(extractBase, true);

    // validate & parse imsmanifest.xml
    const manifestRelPath = manifestEntry.entryName;
    const manifestAbsPath = path.join(extractBase, manifestRelPath);
    if (!fs.existsSync(manifestAbsPath)) {
      fs.unlinkSync(absoluteZipPath);
      return ResponseError(res, MESSAGE.SCORM_MANIFEST_NOT_FOUND_AFTER_EXTRACTION, 400);
    }

    const manifestContent = fs.readFileSync(manifestAbsPath, 'utf-8');
    const parser = new xml2js.Parser({ attrkey: 'attributes' });

    let indexFile   = null;
    let masteryScore = null;

    await parser.parseStringPromise(manifestContent).then((result) => {
		const resources = result.manifest.resources?.[0]?.resource;
		if (resources) {
			for (const resource of resources) {
			const attrs = resource.attributes;
			if (attrs) {
				for (const key of Object.keys(attrs)) {
				if (
					key.toLowerCase().includes('scormtype') &&
					attrs[key].toLowerCase() === 'sco'
				) {
					indexFile = attrs.href;
					break;
				}
				}
			}
			if (indexFile) break;
			}
		}

		// ........................ Extract masteryScore ........................ //
		const organization = result.manifest.organizations?.[0]?.organization?.[0];
		const item = organization?.item?.[0];

		if (item) {
			// Try SCORM 2004 first
			const sequencing = item['imsss:sequencing']?.[0];
			const objectives = sequencing?.['imsss:objectives']?.[0];
			const primaryObjective = objectives?.['imsss:primaryObjective']?.[0];
			const rawScore = primaryObjective?.['imsss:minNormalizedMeasure']?.[0];

			if (rawScore !== undefined && rawScore !== null) {
			masteryScore = Math.round(parseFloat(rawScore) * 100);
			}

			// If not found in SCORM 2004, try SCORM 1.2
			if (masteryScore === null || isNaN(masteryScore)) {
				const scoreTag = item['adlcp:masteryscore']?.[0];
				if (scoreTag !== undefined && scoreTag !== null) {
					masteryScore = parseInt(scoreTag, 10);
				}
			}
		}

    });

    if (!indexFile) {
      fs.unlinkSync(absoluteZipPath);
      return ResponseError(res, MESSAGE.SCORM_LAUNCH_FILE_NOT_FOUND, 400);
    }

    // ........................  Step 4: cleanup & respond ........................ //
    fs.unlinkSync(absoluteZipPath);  // remove uploaded zip

    const manifestDirRelative = path.dirname(manifestRelPath);
    const extractedFolderURL  = `${CONFIG.image_host}uploads/scorm_modules/${zipFileName}/${manifestDirRelative}`;
    const launchUrl           = `${extractedFolderURL}/${indexFile}`;

    return ResponseSuccess(res, {
      data: {
        originalname: uploadedFile.originalname,
        extractedFolderPath: extractedFolderURL,
        launchFile: launchUrl,
        isSCORM: true,
        masteryScore
      },
      message: MESSAGE.ZIP_EXTRACTED_SUCCESSFULLY
    });

  } catch (err) {
    console.error('Unzip Error:', err);
    return ResponseError(res, err, 500, true);
  }
};
module.exports.uploadExtractZipDiwoAsset = uploadExtractZipDiwoAsset;

const getZipContent = async function (req, res) {
	try {
		const relZipPath = req.body?.zippedAssetPath; 
		if (!relZipPath) {
			return res.status(400).send('Invalid zipPath');
		}

		const zipUrl = `${CONFIG.image_host}${relZipPath}`;
		console.log('Fetching zip from:', zipUrl);

		const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
		const zipBuffer = Buffer.from(response.data);

		// Return the original zip buffer as a blob
		res.setHeader('Content-Type', 'application/zip');
		res.send(zipBuffer);
	} catch (err) {
		console.error('Error serving zip content:', err);
		return res.status(500).send('Error serving zip content.');
	}
};
module.exports.getZipContent = getZipContent;

const moveVimeoVideoToFolder = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			videoId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			videoId: parseInt(req.params.vimeoVideoId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, videoId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		// let videoId = req.params.vimeoVideoId;

		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				attributes: ['DiwoFolderId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let data = await getDiwoClientVimeoTokenService(clientId);

		const config = {
			headers: {
				Authorization: `Bearer ${data.vToken}`,
			},
		};

		if (client && client.DiwoFolderId != null) {
			let url = `https://api.vimeo.com/users/${data.vUserId}/projects/${client.DiwoFolderId}/videos/${videoId}`;
			const response = await axios.put(url, {}, config);
		}

		return ResponseSuccess(res, {
			message: 'Moved Video Successfully',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.moveVimeoVideoToFolder = moveVimeoVideoToFolder;

//  Create Workbook
const createWorkbook = async function (req, res) {
	try {
		const workbookSchema = Joi.object({
			id: Joi.any().allow(null),
			title: Joi.string().required(),
			descrip: Joi.string().trim().max(1000).allow(null).allow(''),
			status: Joi.string().valid('Draft', 'Published', 'Deleted'),
			DiwoAssets: Joi.array(),
			allowWithoutPreAssign: Joi.boolean(),
			allowNewLearner: Joi.boolean(),
			newRegProvisional: Joi.boolean(),
			CourseId: Joi.any().allow(null),
			CourseName: Joi.any().allow(null),
			geoTag: Joi.boolean(),
			isMediaWorksheet: Joi.boolean(),
			condition: Joi.string().valid('AND', 'OR'),
			isAppliedBadge: Joi.boolean(),
			isAppliedCertificate: Joi.boolean(),
			isInteractivePdf: Joi.boolean(),
			// isAttachFile: Joi.boolean(),
			haveCertificate: Joi.boolean(),
			BadgeId: Joi.any().allow(null),
			CertificateLine1: Joi.any().allow(null),
			CertificateLine2: Joi.any().allow(null),
			CertificateLine3: Joi.any().allow(null),
			e_duration: Joi.number().allow(null).allow(''),
			l_outcomes: Joi.any().allow(null).allow(''),
			isAllowedPDF: Joi.boolean(),
			DiwoModuleId: Joi.number(),

			CertificateLine1: Joi.any().allow(null),
			CertificateLine2: Joi.any().allow(null),
			CertificateLine3: Joi.any().allow(null),

			isAddSignature: Joi.boolean(),

			signatureName1: Joi.any().allow(null),
			signatureDesignation1: Joi.any().allow(null),
			signaturePath1: Joi.any().allow(null),
			signaturePathName1: Joi.any().allow(null),

			signatureName2: Joi.any().allow(null),
			signatureDesignation2: Joi.any().allow(null),
			signaturePath2: Joi.any().allow(null),
			signaturePathName2: Joi.any().allow(null),
		});

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			workbook_details: workbookSchema,
			// wooksheet_details: Joi.array().items(worksheetSchema),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.user.RoleId),
			workbook_details: req.body.workbook_detail,
			// wooksheet_details: req.body.wooksheet_details,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, workbook_details } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		const userId = req.user.id;
		// let clientId = parseInt(req.params.clientId);
		// const roleId = req.params.roleId;
		// let workbook_details = req.body.workbook_detail;
		let wooksheet_details = req.body.wooksheet_details;
		// let courseId = workbook_details.CourseId;

		// Create Workbook

		let workbook_payload = {
			title: workbook_details.title,
			descrip: workbook_details.descrip,
			e_duration: workbook_details.e_duration,
			l_outcomes: workbook_details.l_outcomes,
			link: workbook_details.link,
			provisional: workbook_details.provisional,
			status: workbook_details.status,
			isDeleted: false,
			UserId: userId,
			ClientId: clientId,
			RoleId: roleId,
			newRegProvisional: workbook_details.newRegProvisional,
			allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
			allowNewLearner: workbook_details.allowNewLearner,
			geoTag: workbook_details.geoTag,
			isMediaWorksheet: workbook_details.isMediaWorksheet,
			DiwoModuleId: workbook_details.DiwoModuleId,
			condition: workbook_details.condition,

			isAppliedBadge: workbook_details.isAppliedBadge,
			isAppliedCertificate: workbook_details.isAppliedCertificate,
			haveCertificate: workbook_details.haveCertificate,
			BadgeId: workbook_details.BadgeId,
			// CertificateId: workbook_details.CertificateId,
			CertificateLine1: workbook_details.CertificateLine1,
			CertificateLine2: workbook_details.CertificateLine2,
			CertificateLine3: workbook_details.CertificateLine3,
			certificateData: workbook_details.certificateData,
			condition: workbook_details.condition,
			isAllowedPDF: workbook_details.isAllowedPDF,

			isAddSignature: workbook_details.isAddSignature,

			signatureName1: workbook_details.signatureName1,
			signatureDesignation1: workbook_details.signatureDesignation1,
			signaturePath1: workbook_details.signaturePath1,
			signaturePathName1: workbook_details.signaturePathName1,

			signatureName2: workbook_details.signatureName2,
			signatureDesignation2: workbook_details.signatureDesignation2,
			signaturePath2: workbook_details.signaturePath2,
			signaturePathName2: workbook_details.signaturePathName2,
		};
		[err, createworkbook] = await to(Workbook.create(workbook_payload));
		if (err) return ResponseError(res, err, 500, true);

		//Update BaseWorkbookId
		[err, updateBaseWorkbookId] = await to(
			Workbook.update(
				{ BaseWorkbookId: createworkbook.id },
				{
					where: {
						id: createworkbook.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// Add Workbook Asset

		if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
			let assets = [];
			for (let asset of workbook_details.DiwoAssets) {
				assets.push({
					path: asset.path,
					fileName: asset.fileName,
					type: asset.type,
					ClientId: clientId,
					WorkbookId: createworkbook.id,
					cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
					MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
					MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
				});
			}
			[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
			if (err) return ResponseError(res, err, 500, true);
		}

		// console.log('createAsset', createAsset);

		// let course_workbook_mapping_payload = {
		// 	WorkbookId: createworkbook.id,
		// 	CourseId: courseId,
		// };
		// [err, courseWorkbookMapping] = await to(Course_workbook_mapping.create(course_workbook_mapping_payload));
		// if (err) return ResponseError(res, err, 500, true);

		/////////////////
		// Create Worksheets
		for (let worksheet of wooksheet_details) {
			// Create Worksheets
			worksheet.WorkbookId = createworkbook.id;
			worksheet.ClientId = clientId;

			if (!worksheet.mediaWorkSheet) {
				worksheet.mediaProfilesData = [];
			}
			[err, create_worksheet] = await to(Worksheet.create(worksheet));
			if (err) return ResponseError(res, err, 500, true);
			// Add Worksheet Asset
			if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
				let assets = [];
				for (let asset of worksheet.DiwoAssets) {
					if (asset.type == 'Image') {
						assets.push({
							path: asset.path,
							fileName: asset.fileName,
							type: asset.type,
							ClientId: clientId,
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							// forBrief: asset && asset.forBrief ? asset.forBrief : false
						});
					} else if (asset.type != 'Document') {
						assets.push({
							path: asset.path,
							fileName: asset.fileName,
							type: asset.type,
							ClientId: clientId,
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							vmoVideoId: asset.vmoVideoId,
							isTranscoding: asset.Transcoding,
							cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
							// forBrief: asset && asset.forBrief ? asset.forBrief : false
							MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
							MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
						});
					}
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			// Add Worksheet Ofline Brief Asset
			if (worksheet.briefFiles && worksheet.briefFiles.length > 0) {
				let assets = [];
				for (let asset of worksheet.briefFiles) {
					if (asset.type == 'Image') {
						assets.push({
							path: asset.path,
							fileName: asset.fileName,
							type: asset.type,
							ClientId: clientId,
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							forBrief: asset && asset.forBrief ? asset.forBrief : false,
						});
					} else {
						assets.push({
							path: asset.path,
							fileName: asset.fileName,
							type: asset.type,
							ClientId: clientId,
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							vmoVideoId: asset.vmoVideoId,
							cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
							isTranscoding: asset.Transcoding,
							forBrief: asset && asset.forBrief ? asset.forBrief : false,
							MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
							MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
						});
					}
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			let createDocAsset;
			// Add worksheet learning Content
			if (worksheet.pdfFiles && worksheet.pdfFiles.length > 0) {
				let assets = [];
				for (let asset of worksheet.pdfFiles) {
					if (asset.type == 'Document') {
						assets.push({
							path: asset.path,
							fileName: asset.fileName,
							type: asset.type,
							ClientId: clientId,
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
						});
					}
				}

				[err, createDocAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			//Create Spin The Wheel question Category
			if (
				worksheet &&
				worksheet.type == 'Spin The Wheel' &&
				worksheet.spinWheelQueCategory &&
				worksheet.spinWheelQueCategory.length > 0
			) {
				let spinWheelQueCategory = [];
				for (let question_category of worksheet.spinWheelQueCategory) {
					// Create Question Category
					spinWheelQueCategory.push({
						WorkbookId: createworkbook.id,
						WorksheetId: create_worksheet.id,
						category_index: question_category.category_index,
						category_name: question_category.category_name.trimStart().trimEnd(),
						totalquestion: question_category.totalquestion,
						totalscore: question_category.totalscore,
						characterRemain: question_category.characterRemain,
					});
				}

				[err, createSpinCategory] = await to(DiwoSpinWheelCat.bulkCreate(spinWheelQueCategory, { returning: true }));
				if (err) return ResponseError(res, err, 500, true);

				// Iterate over each Spin Category
				for (const queCategory_ of createSpinCategory) {
					const queCategory = queCategory_.convertToJSON();
					for (let question of worksheet.Questions) {
						if (queCategory.category_index === question.spinCatIndex) {
							question.DiwoSpinWheelCatId = queCategory.id;
						}
					}
				}
			}

			//survey question group
			if (
				worksheet &&
				worksheet.type == 'Survey' &&
				worksheet.question_Group &&
				worksheet.questionGroups &&
				worksheet.questionGroups.length > 0
			) {
				let questiongroup = [];
				for (let question_group of worksheet.questionGroups) {
					// Create QuestionGroup
					questiongroup.push({
						WorkbookId: createworkbook.id,
						WorksheetId: create_worksheet.id,
						index: question_group.index,
						group_name: question_group.group_name,
					});
				}

				[err, createsurveyGroup] = await to(SurveyQueGroup.bulkCreate(questiongroup, { returning: true }));
				if (err) return ResponseError(res, err, 500, true);

				// Iterate over each survey group
				for (const queSurvey_ of createsurveyGroup) {
					// Convert the current survey group to JSON format
					const queSurvey = queSurvey_.convertToJSON();
					// Iterate over each question in the worksheet
					for (let question of worksheet.Questions) {
						// Check if the group index of the current survey group matches the question's group index
						if (queSurvey.index === question.group_index) {
							// Update the SurveyQueGroupId of the question with the ID of the current survey group
							question.SurveyQueGroupId = queSurvey.id;
						}
					}
				}
			}

			for (let question of worksheet.Questions) {
				// Create Question
				question.ClientId = clientId;
				question.WorkbookId = createworkbook.id;
				question.WorksheetId = create_worksheet.id;
				question.allowFileTypes = question.allowFileTypes.toString();
				question.surveyCharLimit = question.surveyCharcterLimit ? parseInt(question.surveyCharcterLimit) : null;
				if (typeof question.userRatingArray !== 'string') {
					question.userRatingArray =
						Array.isArray(question.userRatingArray) &&
						question.userRatingArray.length > 0 &&
						question.userRatingArray[0] != null
							? question.userRatingArray.toString()
							: '';
				}

				if (question.questionType == 'Rating scale') {
					question.SurveyRatingType = question.SurveyRatingType ? question.SurveyRatingType : null;
					question.ratingMinLabel = question.ratingMinLabel ? question.ratingMinLabel : null;
					question.ratingMaxLabel = question.ratingMaxLabel ? question.ratingMaxLabel : null;
					if (typeof question.userRatingArray !== 'string') {
						question.userRatingArray =
							Array.isArray(question.userRatingArray) &&
							question.userRatingArray.length > 0 &&
							question.userRatingArray[0] != null
								? question.userRatingArray.toString()
								: '';
					}
				}

				[err, create_question] = await to(Question.create(question));
				if (err) return ResponseError(res, err, 500, true);
				if (question.DiwoAssets && question.DiwoAssets.length > 0) {
					let assets = [];
					for (let asset of question.DiwoAssets) {
						if (asset.type == 'Image') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								QuestionId: create_question.id,
							});
						} else {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								QuestionId: create_question.id,
								vmoVideoId: asset.vmoVideoId,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								isTranscoding: asset.Transcoding,
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
							});
						}
					}
					[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}
				if (worksheet.type != 'Content') {
					let sequence = 1;
					for (let option of question.Options) {
						//Create Option
						option.ClientId = clientId;
						option.WorkbookId = createworkbook.id;
						option.WorksheetId = create_worksheet.id;
						option.QuestionId = create_question.id;
						option.sr_no = sequence;
						[err, create_option] = await to(Option.create(option));
						if (err) return ResponseError(res, err, 500, true);
						sequence++;
					}
				}
			}
		}

		// [err, worbook] = await to(
		// 	Workbook.findOne({
		// 		where: {
		// 			id: createworkbook.id,
		// 		},
		// 		include: [
		// 			{
		// 				model: DiwoAsset,
		// 				where: {
		// 					WorksheetId: {
		// 						[Op.eq]: null,
		// 					},
		// 					QuestionId: {
		// 						[Op.eq]: null,
		// 					},
		// 				},
		// 			},
		// 			{
		// 				model: Worksheet,
		// 				include: [
		// 					{
		// 						model: DiwoAsset,
		// 					},
		// 					{
		// 						model: Question,
		// 						include: [
		// 							{
		// 								model: DiwoAsset,
		// 							},
		// 							{
		// 								model: Option,
		// 							},
		// 						],
		// 					},
		// 				],
		// 			},
		// 		],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.WORKBOOK_CREATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{workbook_name}}', workbook_details.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.WORKBOOK_CREATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{workbook_name}}', workbook_details.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Workbook`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					WorkbookId: createworkbook.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		updateMediaCMSStatusInDiwoAssets(createworkbook.id);

		return ResponseSuccess(res, {
			WorkbookId: createworkbook.id,
			data: notifcationMessageForUser,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createWorkbook = createWorkbook;

//  Create Scorm Workbook
const createScormWorkbook = async function (req, res) {
	try {
		const workbookSchema = Joi.object({
			id: Joi.any().allow(null),
			title: Joi.string().required(),
			descrip: Joi.string().trim().max(1000).allow(null).allow(''),
			status: Joi.string().valid('Draft', 'Published', 'Deleted'),
			DiwoAssets: Joi.array(),
			ScromAssets: Joi.array(),
			condition: Joi.string().valid('AND', 'OR'),
			allowWithoutPreAssign: Joi.boolean(),
			allowNewLearner: Joi.boolean(),
			newRegProvisional: Joi.boolean(),
			// # CourseId: Joi.any().allow(null),
			// # CourseName: Joi.any().allow(null),
			isSCORM: Joi.boolean(),
			e_duration: Joi.number().allow(null).allow(''),
			l_outcomes: Joi.any().allow(null).allow(''),
			IsMasteryScore: Joi.boolean(),
			masteryScore: Joi.number().allow(null),
			DiwoModuleId: Joi.number(),
		});

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			workbook_details: workbookSchema,
			// # // wooksheet_details: Joi.array().items(worksheetSchema),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.user.RoleId),
			workbook_details: req.body.workbook_detail,
			// # // wooksheet_details: req.body.wooksheet_details,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, workbook_details } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		const userId = req.user.id;
		// let clientId = parseInt(req.params.clientId);
		// const roleId = req.params.roleId;
		// let workbook_details = req.body.workbook_detail;
		// let wooksheet_details = req.body.wooksheet_details;
		// let courseId = workbook_details.CourseId;

		// Create Workbook
		let workbook_payload = {
			title: workbook_details.title,
			descrip: workbook_details.descrip,
			e_duration: workbook_details.e_duration,
			l_outcomes: workbook_details.l_outcomes,
			// link: workbook_details.link,
			provisional: workbook_details.provisional,
			status: workbook_details.status,
			isDeleted: false,
			UserId: userId,
			ClientId: clientId,
			RoleId: roleId,
			newRegProvisional: workbook_details.newRegProvisional,
			allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
			allowNewLearner: workbook_details.allowNewLearner,
			isMediaWorksheet: workbook_details.isMediaWorksheet,
			DiwoModuleId: workbook_details.DiwoModuleId,
			condition: workbook_details.condition,
			isSCORM: workbook_details.isSCORM,
			condition: workbook_details.condition,

			// Worbook scrom_assets
			fileName: workbook_details.ScromAssets[0].fileName,
			type: workbook_details.ScromAssets[0].type,
			// isSCORM: workbook_details.ScromAssets[0].isSCORM ? workbook_details.ScromAssets[0].isSCORM : false,
			extractedZipFilePath: workbook_details.ScromAssets[0].extractedZipFilePath
				? workbook_details.ScromAssets[0].extractedZipFilePath
				: null,
			launchFile: workbook_details.ScromAssets[0].launchFile ? workbook_details.ScromAssets[0].launchFile : null,
			masteryScore: workbook_details.masteryScore,
			IsMasteryScore: workbook_details.IsMasteryScore,
		};
		[err, createworkbook] = await to(Workbook.create(workbook_payload));
		if (err) return ResponseError(res, err, 500, true);

		//Update BaseWorkbookId
		[err, updateBaseWorkbookId] = await to(
			Workbook.update(
				{ BaseWorkbookId: createworkbook.id },
				{
					where: {
						id: createworkbook.id,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		// Add Workbook Asset

		if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
			let assets = [];
			for (let asset of workbook_details.DiwoAssets) {
				assets.push({
					path: asset.path,
					fileName: asset.fileName,
					type: asset.type,
					ClientId: clientId,
					WorkbookId: createworkbook.id,
					cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
				});
			}
			[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
			if (err) return ResponseError(res, err, 500, true);
		}

		// let course_workbook_mapping_payload = {
		// 	WorkbookId: createworkbook.id,
		// 	CourseId: courseId,
		// };
		// [err, courseWorkbookMapping] = await to(Course_workbook_mapping.create(course_workbook_mapping_payload));
		// if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.WORKBOOK_CREATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{workbook_name}}', workbook_details.title);

		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.WORKBOOK_CREATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{workbook_name}}', workbook_details.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Create Workbook`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					WorkbookId: createworkbook.id,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: notifcationMessageForUser,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.createScormWorkbook = createScormWorkbook;

//  Update ScormWorkbook
const updatScormWorkbook = async function (req, res) {
	try {
		const workbookSchema = Joi.object({
			id: Joi.number().integer().positive().required(),
			title: Joi.string().required(),
			descrip: Joi.string().trim().max(1000).allow(null).allow(''),
			status: Joi.string().valid('Draft', 'Published', 'Deleted'),
			DiwoAssets: Joi.array(),
			ScromAssets: Joi.array(),
			condition: Joi.string().valid('AND', 'OR'),
			allowWithoutPreAssign: Joi.boolean(),
			allowNewLearner: Joi.boolean(),
			newRegProvisional: Joi.boolean(),
			// # CourseId: Joi.any().allow(null),
			// # CourseName: Joi.any().allow(null),
			isSCORM: Joi.boolean(),
			e_duration: Joi.number().allow(null).allow(''),
			l_outcomes: Joi.any().allow(null).allow(''),
			DiwoModuleId: Joi.number(),
			IsMasteryScore: Joi.boolean(),
			masteryScore: Joi.number().allow(null),
		});

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			workbookId: Joi.number().integer().min(1).positive().required(),
			workbook_details: workbookSchema,
			// wooksheet_details: Joi.array().items(worksheetSchema),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.user.RoleId),
			workbookId: parseInt(req.params.workbookId),
			workbook_details: req.body.workbook_detail,
			// wooksheet_details: req.body.wooksheet_details,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, workbookId, workbook_details } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let userId = req.user.id;
		// let clientId = req.params.clientId;
		// let roleId = req.params.roleId;
		// let workbookId = parseInt(req.params.workbookId);
		// let workbook_details = req.body.workbook_detail;
		// # let wooksheet_details = req.body.wooksheet_details;

		let createNewVersion = true;
		let version, BaseWorkbookId;
		//Check Create new Version or Update Current Version
		// Check Previous Workbook Status
		[err, checkPreviousVersion] = await to(
			Workbook.findOne({
				where: {
					[Op.or]: {
						BaseWorkbookId: workbookId,
						id: workbookId,
					},
					default: true,
				},
				attributes: ['id', 'status', 'default', 'version', 'BaseWorkbookId', 'DiwoModuleId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (checkPreviousVersion) {
			version = checkPreviousVersion.version;
			BaseWorkbookId = checkPreviousVersion.BaseWorkbookId;
			if (checkPreviousVersion?.status == 'Draft') {
				createNewVersion = false;
			}
		}
		console.log('-----------wb---', checkPreviousVersion.convertToJSON());

		// let courseId = workbook_details.CourseId;
		//Create Course
		// let course_payload = {
		//     title: workbook_details.title,
		//     description: workbook_details.descr,
		//     ClientId: clientId
		// };
		// [err, createCourse] = await to(Course.create(course_payload));
		// if (err) return ResponseError(res, err, 500, true);

		if (createNewVersion) {
			//Update Default Flag of preivous Workbook
			[err, updateDetails] = await to(
				Workbook.update(
					{ default: false },
					{
						where: {
							id: workbookId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			// Create Workbook
			let createworkbook;

			let workbook_payload = {
				title: workbook_details.title,
				descrip: workbook_details.descrip,
				e_duration: workbook_details.e_duration,
				l_outcomes: workbook_details.l_outcomes,
				// link: workbook_details.link,
				status: workbook_details.status,
				isDeleted: false,
				UserId: userId,
				ClientId: clientId,
				RoleId: roleId,
				newRegProvisional: workbook_details.newRegProvisional,
				allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
				allowNewLearner: workbook_details.allowNewLearner,

				// Worbook scrom_assets
				fileName: workbook_details.ScromAssets[0].fileName,
				type: workbook_details.ScromAssets[0].type,
				// isSCORM: workbook_details.ScromAssets[0].isSCORM ? workbook_details.ScromAssets[0].isSCORM : false,
				extractedZipFilePath: workbook_details.ScromAssets[0].extractedZipFilePath
					? workbook_details.ScromAssets[0].extractedZipFilePath
					: null,
				launchFile: workbook_details.ScromAssets[0].launchFile ? workbook_details.ScromAssets[0].launchFile : null,
				masteryScore: workbook_details.masteryScore,
				IsMasteryScore: workbook_details.IsMasteryScore,
				DiwoModuleId: workbook_details.DiwoModuleId,
				isSCORM: workbook_details.isSCORM,
				condition: workbook_details.condition,
				version: version + 1,
				default: true,
				BaseWorkbookId: BaseWorkbookId,
			};

			[err, createworkbook] = await to(Workbook.create(workbook_payload));
			if (err) return ResponseError(res, err, 500, true);

			if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
				let assets = [];
				for (let asset of workbook_details.DiwoAssets) {
					assets.push({
						path: asset.path,
						fileName: asset.fileName,
						type: asset.type,
						ClientId: clientId,
						WorkbookId: createworkbook.id,
						cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
					});
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			// Assignment of  Trainer
			// Bulk create only new records
			//Get All Trainer Assignment for Previous Version
			[err, getAllPreviousVersionAssignment] = await to(
				WorkbookTrainerMapping.findAll({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (getAllPreviousVersionAssignment.length > 0) {
				let trainerWorkBooks = [];
				for (let user of getAllPreviousVersionAssignment) {
					trainerWorkBooks.push({
						WorkbookId: createworkbook.id,
						UserId: user.UserId,
					});
				}
				if (trainerWorkBooks.length > 0) {
					const [err, addUserGroup] = await to(WorkbookTrainerMapping.bulkCreate(trainerWorkBooks));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
			if (checkPreviousVersion?.DiwoModuleId == 1) {
				//Need to Delete and Add All  Pre-Assignment with new Version Of Module.
				deletePreviousVersionOfWorkbook(workbookId, createworkbook.id);
			}
			//End Create Worksheet
		} else {
			// Update Workbook
			let workbook_payload = {
				title: workbook_details.title,
				descrip: workbook_details.descrip,
				e_duration: workbook_details.e_duration,
				l_outcomes: workbook_details.l_outcomes,
				// link: workbook_details.link,
				status: workbook_details.status,
				isDeleted: false,

				// Worbook scrom_assets
				fileName: workbook_details.ScromAssets[0].fileName,
				type: workbook_details.ScromAssets[0].type,
				// isSCORM: workbook_details.ScromAssets[0].isSCORM ? workbook_details.ScromAssets[0].isSCORM : false,
				extractedZipFilePath: workbook_details.ScromAssets[0].extractedZipFilePath
					? workbook_details.ScromAssets[0].extractedZipFilePath
					: null,
				launchFile: workbook_details.ScromAssets[0].launchFile ? workbook_details.ScromAssets[0].launchFile : null,
				masteryScore: workbook_details.masteryScore,
				IsMasteryScore: workbook_details.IsMasteryScore,
				// UserId: userId,
				// ClientId: clientId,
				// RoleId: roleId,
				newRegProvisional: workbook_details.newRegProvisional,
				allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
				allowNewLearner: workbook_details.allowNewLearner,
				DiwoModuleId: workbook_details.DiwoModuleId,
				condition: workbook_details.condition,
				isSCORM: workbook_details.isSCORM,
				// CertificateId: workbook_details.CertificateId,
				condition: workbook_details.condition,
			};
			[err, update_Workbook] = await to(
				Workbook.update(workbook_payload, {
					where: {
						id: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Update Course Linking
			// [err, courseWorkbookMapping] = await to(
			// 	Course_workbook_mapping.update(
			// 		{
			// 			CourseId: courseId,
			// 		},
			// 		{
			// 			where: {
			// 				WorkbookId: workbookId,
			// 			},
			// 		}
			// 	)
			// );
			// if (err) return ResponseError(res, err, 500, true);

			// Remove Data
			[err, deleteWorkbookAsset] = await to(
				DiwoAsset.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// Add Workbook Asset
			if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
				let assets = [];
				for (let asset of workbook_details.DiwoAssets) {
					assets.push({
						path: asset.path,
						fileName: asset.fileName,
						type: asset.type,
						ClientId: clientId,
						WorkbookId: workbookId,
						cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
					});
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			// let course_workbook_mapping_payload = {
			//     WorkbookId: workbookId,
			//     CourseId: createCourse.id
			// };
			// [err, courseWorkbookMapping] = await to(Course_workbook_mapping.create(course_workbook_mapping_payload));
			// if (err) return ResponseError(res, err, 500, true);

			/////////////////
			// Create Worksheets
		}

		// [err, workbook] = await to(
		// 	Workbook.findOne({
		// 		where: {
		// 			id: workbookId,
		// 		},
		// 		include: [
		// 			{
		// 				model: DiwoAsset,
		// 			},
		// 			{
		// 				model: Worksheet,
		// 				include: [
		// 					{
		// 						model: DiwoAsset,
		// 					},
		// 					{
		// 						model: Question,
		// 						include: [
		// 							{
		// 								model: DiwoAsset,
		// 							},
		// 							{
		// 								model: Option,
		// 							},
		// 						],
		// 					},
		// 				],
		// 			},
		// 		],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.WORKBOOK_UPDATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{workbook_name}}', workbook_details.title);
		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.WORKBOOK_UPDATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{workbook_name}}', workbook_details.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Workbook`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					WorkbookId: workbookId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: notifcationMessageForUser,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updatScormWorkbook = updatScormWorkbook;

//  Update Workbook
const updateWorkbook = async function (req, res) {
	try {
		const workbookSchema = Joi.object({
			id: Joi.number().integer().positive().required(),
			title: Joi.string().required(),
			descrip: Joi.string().trim().max(1000).allow(null).allow(''),
			status: Joi.string().valid('Draft', 'Published', 'Deleted'),
			DiwoAssets: Joi.array(),
			allowWithoutPreAssign: Joi.boolean(),
			allowNewLearner: Joi.boolean(),
			newRegProvisional: Joi.boolean(),
			CourseId: Joi.any().allow(null),
			CourseName: Joi.any().allow(null),
			geoTag: Joi.boolean(),
			isMediaWorksheet: Joi.boolean(),
			condition: Joi.string().valid('AND', 'OR'),
			isAppliedBadge: Joi.boolean(),
			isAppliedCertificate: Joi.boolean(),
			isInteractivePdf: Joi.boolean(),
			// isAttachFile: Joi.boolean(),
			haveCertificate: Joi.boolean(),
			BadgeId: Joi.any().allow(null),
			CertificateLine1: Joi.any().allow(null),
			CertificateLine2: Joi.any().allow(null),
			CertificateLine3: Joi.any().allow(null),
			e_duration: Joi.number().allow(null).allow(''),
			l_outcomes: Joi.any().allow(null).allow(''),
			isAllowedPDF: Joi.boolean(),
			DiwoModuleId: Joi.number(),

			isAddSignature: Joi.boolean(),

			signatureName1: Joi.any().allow(null),
			signatureDesignation1: Joi.any().allow(null),
			signaturePath1: Joi.any().allow(null),
			signaturePathName1: Joi.any().allow(null),

			signatureName2: Joi.any().allow(null),
			signatureDesignation2: Joi.any().allow(null),
			signaturePath2: Joi.any().allow(null),
			signaturePathName2: Joi.any().allow(null),
		});

		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			roleId: Joi.number().integer().min(validationConstant.role.min).max(validationConstant.role.max).required(),
			workbookId: Joi.number().integer().min(1).positive().required(),
			workbook_details: workbookSchema,
			// wooksheet_details: Joi.array().items(worksheetSchema),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			roleId: parseInt(req.user.RoleId),
			workbookId: parseInt(req.params.workbookId),
			workbook_details: req.body.workbook_detail,
			// wooksheet_details: req.body.wooksheet_details,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, roleId, workbookId, workbook_details } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let userId = req.user.id;
		// let clientId = req.params.clientId;
		// let roleId = req.params.roleId;
		// let workbookId = parseInt(req.params.workbookId);
		// let workbook_details = req.body.workbook_detail;
		let wooksheet_details = req.body.wooksheet_details;

		let createNewVersion = true;
		let version, BaseWorkbookId;
		//Check Create new Version or Update Current Version
		// Check Previous Workbook Status
		[err, checkPreviousVersion] = await to(
			Workbook.findOne({
				where: {
					[Op.or]: {
						BaseWorkbookId: workbookId,
						id: workbookId,
					},
					default: true,
				},
				attributes: ['id', 'status', 'default', 'version', 'BaseWorkbookId', 'DiwoModuleId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (checkPreviousVersion) {
			version = checkPreviousVersion.version;
			BaseWorkbookId = checkPreviousVersion.BaseWorkbookId;
			if (checkPreviousVersion?.status == 'Draft') {
				createNewVersion = false;
			}
		}
		console.log('-----------wb---', checkPreviousVersion.convertToJSON());

		// let courseId = workbook_details.CourseId;
		//Create Course
		// let course_payload = {
		//     title: workbook_details.title,
		//     description: workbook_details.descr,
		//     ClientId: clientId
		// };
		// [err, createCourse] = await to(Course.create(course_payload));
		// if (err) return ResponseError(res, err, 500, true);

		if (createNewVersion) {
			//Update Default Flag of preivous Workbook
			[err, updateDetails] = await to(
				Workbook.update(
					{ default: false },
					{
						where: {
							id: workbookId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);

			// Create Workbook
			let createworkbook;

			let workbook_payload = {
				title: workbook_details.title,
				descrip: workbook_details.descrip,
				e_duration: workbook_details.e_duration,
				l_outcomes: workbook_details.l_outcomes,
				link: workbook_details.link,
				provisional: workbook_details.provisional,
				status: workbook_details.status,
				isDeleted: false,
				UserId: userId,
				ClientId: clientId,
				RoleId: roleId,
				newRegProvisional: workbook_details.newRegProvisional,
				allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
				allowNewLearner: workbook_details.allowNewLearner,
				geoTag: workbook_details.geoTag,
				isMediaWorksheet: workbook_details.isMediaWorksheet,
				DiwoModuleId: workbook_details.DiwoModuleId,

				isAddSignature: workbook_details.isAddSignature,

				signatureName1: workbook_details.signatureName1,
				signatureDesignation1: workbook_details.signatureDesignation1,
				signaturePath1: workbook_details.signaturePath1,
				signaturePathName1: workbook_details.signaturePathName1,

				signatureName2: workbook_details.signatureName2,
				signatureDesignation2: workbook_details.signatureDesignation2,
				signaturePath2: workbook_details.signaturePath2,
				signaturePathName2: workbook_details.signaturePathName2,

				condition: workbook_details.condition,

				isAppliedBadge: workbook_details.isAppliedBadge,
				isAppliedCertificate: workbook_details.isAppliedCertificate,
				haveCertificate: workbook_details.haveCertificate,
				BadgeId: workbook_details.BadgeId,
				// CertificateId: workbook_details.CertificateId,
				CertificateLine1: workbook_details.CertificateLine1,
				CertificateLine2: workbook_details.CertificateLine2,
				CertificateLine3: workbook_details.CertificateLine3,
				certificateData: workbook_details.certificateData,
				condition: workbook_details.condition,
				isAllowedPDF: workbook_details.isAllowedPDF,
				version: version + 1,
				default: true,
				BaseWorkbookId: BaseWorkbookId,
			};

			[err, createworkbook] = await to(Workbook.create(workbook_payload));
			if (err) return ResponseError(res, err, 500, true);

			if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
				let assets = [];
				for (let asset of workbook_details.DiwoAssets) {
					assets.push({
						path: asset.path,
						fileName: asset.fileName,
						type: asset.type,
						ClientId: clientId,
						WorkbookId: createworkbook.id,
						cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
						MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
						MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
					});
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			// Create Worksheets
			for (let worksheet of wooksheet_details) {
				delete worksheet.id;
				worksheet.WorkbookId = createworkbook.id;
				worksheet.ClientId = clientId;
				if (!worksheet.mediaWorkSheet) {
					worksheet.mediaProfilesData = [];
				}
				[err, create_worksheet] = await to(Worksheet.create(worksheet));
				if (err) return ResponseError(res, err, 500, true);
				// Add Worksheet Asset
				if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
					let assets = [];
					for (let asset of worksheet.DiwoAssets) {
						if (asset.type == 'Image') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								WorksheetId: create_worksheet.id,
								// forBrief: asset && asset.forBrief ? asset.forBrief : false
							});
						} else {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								WorksheetId: create_worksheet.id,
								vmoVideoId: asset.vmoVideoId,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								isTranscoding: asset.Transcoding,
								// forBrief: asset && asset.forBrief ? asset.forBrief : false
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
							});
						}
					}
					[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}

				// Add Worksheet Ofline Brief Asset
				if (worksheet.briefFiles && worksheet.briefFiles.length > 0) {
					let assets = [];
					for (let asset of worksheet.briefFiles) {
						if (asset.type == 'Image') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								WorksheetId: create_worksheet.id,
								forBrief: asset && asset.forBrief ? asset.forBrief : false,
							});
						} else {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: createworkbook.id,
								WorksheetId: create_worksheet.id,
								vmoVideoId: asset.vmoVideoId,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								isTranscoding: asset.Transcoding,
								forBrief: asset && asset.forBrief ? asset.forBrief : false,
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
							});
						}
					}
					[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}

				//Create Spin The Wheel question Category
				if (
					worksheet &&
					worksheet.type == 'Spin The Wheel' &&
					worksheet.spinWheelQueCategory &&
					worksheet.spinWheelQueCategory.length > 0
				) {
					let spinWheelQueCategory = [];
					for (let question_category of worksheet.spinWheelQueCategory) {
						// Create Question Category
						spinWheelQueCategory.push({
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							category_index: question_category.category_index,
							category_name: question_category.category_name.trimStart().trimEnd(),
							totalquestion: question_category.totalquestion,
							totalscore: question_category.totalscore,
							characterRemain: question_category.characterRemain,
						});
					}

					[err, createSpinCategory] = await to(DiwoSpinWheelCat.bulkCreate(spinWheelQueCategory, { returning: true }));
					if (err) return ResponseError(res, err, 500, true);

					// Iterate over each Spin Category
					for (const queCategory_ of createSpinCategory) {
						const queCategory = queCategory_.convertToJSON();
						for (let question of worksheet.Questions) {
							if (queCategory.category_index === question.spinCatIndex) {
								question.DiwoSpinWheelCatId = queCategory.id;
							}
						}
					}
				}

				//survey question group
				if (
					worksheet &&
					worksheet.type == 'Survey' &&
					worksheet.question_Group &&
					worksheet.questionGroups &&
					worksheet.questionGroups.length > 0
				) {
					let questiongroup = [];
					for (let question_group of worksheet.questionGroups) {
						// Create QuestionGroup
						questiongroup.push({
							WorkbookId: createworkbook.id,
							WorksheetId: create_worksheet.id,
							index: question_group.index,
							group_name: question_group.group_name,
						});
					}

					[err, createsurveyGroup] = await to(SurveyQueGroup.bulkCreate(questiongroup, { returning: true }));
					if (err) return ResponseError(res, err, 500, true);

					// Iterate over each survey group
					for (const queSurvey_ of createsurveyGroup) {
						// Convert the current survey group to JSON format
						const queSurvey = queSurvey_.convertToJSON();
						// Iterate over each question in the worksheet
						for (let question of worksheet.Questions) {
							// Check if the group index of the current survey group matches the question's group index
							if (queSurvey.index === question.group_index) {
								// Update the SurveyQueGroupId of the question with the ID of the current survey group
								question.SurveyQueGroupId = queSurvey.id;
							}
						}
					}
				}

				for (let question of worksheet.Questions) {
					// Create Question
					delete question.id;
					question.ClientId = clientId;
					question.WorkbookId = createworkbook.id;
					question.WorksheetId = create_worksheet.id;
					question.allowFileTypes = question.allowFileTypes.toString();
					question.surveyCharLimit = question.surveyCharcterLimit ? parseInt(question.surveyCharcterLimit) : null;
					if (typeof question.userRatingArray !== 'string') {
						question.userRatingArray =
							Array.isArray(question.userRatingArray) &&
							question.userRatingArray.length > 0 &&
							question.userRatingArray[0] != null
								? question.userRatingArray.toString()
								: '';
					}
					[err, create_question] = await to(Question.create(question));
					if (err) return ResponseError(res, err, 500, true);
					if (question.DiwoAssets && question.DiwoAssets.length > 0) {
						let assets = [];
						for (let asset of question.DiwoAssets) {
							if (asset.type == 'Image') {
								assets.push({
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									ClientId: clientId,
									WorkbookId: createworkbook.id,
									QuestionId: create_question.id,
								});
							} else {
								assets.push({
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									ClientId: clientId,
									WorkbookId: createworkbook.id,
									QuestionId: create_question.id,
									vmoVideoId: asset.vmoVideoId,
									cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
									isTranscoding: asset.Transcoding,
									MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
									MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
								});
							}
						}
						[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
						if (err) return ResponseError(res, err, 500, true);
					}
					if (worksheet.type != 'Content') {
						let sequence = 1;
						for (let option of question.Options) {
							//Create Option
							delete option.id;
							option.ClientId = clientId;
							option.WorkbookId = createworkbook.id;
							option.WorksheetId = create_worksheet.id;
							option.QuestionId = create_question.id;
							option.sr_no = sequence;
							[err, create_option] = await to(Option.create(option));
							if (err) return ResponseError(res, err, 500, true);
							sequence++;
						}
					}
				}
			}

			// Assignment of  Trainer
			// Bulk create only new records
			//Get All Trainer Assignment for Previous Version
			[err, getAllPreviousVersionAssignment] = await to(
				WorkbookTrainerMapping.findAll({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (getAllPreviousVersionAssignment.length > 0) {
				let trainerWorkBooks = [];
				for (let user of getAllPreviousVersionAssignment) {
					trainerWorkBooks.push({
						WorkbookId: createworkbook.id,
						UserId: user.UserId,
					});
				}
				if (trainerWorkBooks.length > 0) {
					const [err, addUserGroup] = await to(WorkbookTrainerMapping.bulkCreate(trainerWorkBooks));
					if (err) return ResponseError(res, err, 500, true);
				}
			}
			if (checkPreviousVersion?.DiwoModuleId == 1) {
				//Need to Delete and Add All  Pre-Assignment with new Version Of Module.
				deletePreviousVersionOfWorkbook(workbookId, createworkbook.id);
			}
			//End Create Worksheet
		} else {
			// Update Workbook
			let workbook_payload = {
				title: workbook_details.title,
				descrip: workbook_details.descrip,
				e_duration: workbook_details.e_duration,
				l_outcomes: workbook_details.l_outcomes,
				link: workbook_details.link,
				provisional: workbook_details.provisional,
				status: workbook_details.status,
				isDeleted: false,
				// UserId: userId,
				// ClientId: clientId,
				// RoleId: roleId,
				newRegProvisional: workbook_details.newRegProvisional,
				allowWithoutPreAssign: workbook_details.allowWithoutPreAssign,
				allowNewLearner: workbook_details.allowNewLearner,
				geoTag: workbook_details.geoTag,
				isMediaWorksheet: workbook_details.isMediaWorksheet,
				DiwoModuleId: workbook_details.DiwoModuleId,
				condition: workbook_details.condition,
				isAppliedBadge: workbook_details.isAppliedBadge,
				isAppliedCertificate: workbook_details.isAppliedCertificate,
				haveCertificate: workbook_details.haveCertificate,
				BadgeId: workbook_details.BadgeId,
				// CertificateId: workbook_details.CertificateId,

				CertificateLine1: workbook_details.CertificateLine1,
				CertificateLine2: workbook_details.CertificateLine2,
				CertificateLine3: workbook_details.CertificateLine3,
				certificateData: workbook_details.certificateData,
				condition: workbook_details.condition,
				isAllowedPDF: workbook_details.isAllowedPDF,
				isAddSignature: workbook_details.isAddSignature,

				signatureName1: workbook_details.signatureName1,
				signatureDesignation1: workbook_details.signatureDesignation1,
				signaturePath1: workbook_details.signaturePath1,
				signaturePathName1: workbook_details.signaturePathName1,

				signatureName2: workbook_details.signatureName2,
				signatureDesignation2: workbook_details.signatureDesignation2,
				signaturePath2: workbook_details.signaturePath2,
				signaturePathName2: workbook_details.signaturePathName2,
			};
			[err, update_Workbook] = await to(
				Workbook.update(workbook_payload, {
					where: {
						id: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Update Course Linking
			// [err, courseWorkbookMapping] = await to(
			// 	Course_workbook_mapping.update(
			// 		{
			// 			CourseId: courseId,
			// 		},
			// 		{
			// 			where: {
			// 				WorkbookId: workbookId,
			// 			},
			// 		}
			// 	)
			// );
			// if (err) return ResponseError(res, err, 500, true);

			// Remove Data
			[err, deleteWorkbookAsset] = await to(
				DiwoAsset.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, deleteOption] = await to(
				Option.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, deleteQuestion] = await to(
				Question.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, deleteWorksheet] = await to(
				Worksheet.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);

			if (err) return ResponseError(res, err, 500, true);

			[err, deleteSurveyQueGroup] = await to(
				SurveyQueGroup.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, deleteDiwoSpinWheelCat] = await to(
				DiwoSpinWheelCat.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// Add Workbook Asset
			if (workbook_details.DiwoAssets && workbook_details.DiwoAssets.length > 0) {
				let assets = [];
				for (let asset of workbook_details.DiwoAssets) {
					assets.push({
						path: asset.path,
						fileName: asset.fileName,
						type: asset.type,
						ClientId: clientId,
						WorkbookId: workbookId,
						cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
						MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
						MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
					});
				}
				[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
				if (err) return ResponseError(res, err, 500, true);
			}

			// let course_workbook_mapping_payload = {
			//     WorkbookId: workbookId,
			//     CourseId: createCourse.id
			// };
			// [err, courseWorkbookMapping] = await to(Course_workbook_mapping.create(course_workbook_mapping_payload));
			// if (err) return ResponseError(res, err, 500, true);

			/////////////////
			// Create Worksheets

			for (let worksheet of wooksheet_details) {
				// Create Worksheets
				delete worksheet.id;
				worksheet.WorkbookId = workbookId;
				worksheet.ClientId = clientId;
				if (!worksheet.mediaWorkSheet) {
					worksheet.mediaProfilesData = [];
				}
				[err, create_worksheet] = await to(Worksheet.create(worksheet));
				if (err) return ResponseError(res, err, 500, true);
				// Add Worksheet Asset
				if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
					let assets = [];
					for (let asset of worksheet.DiwoAssets) {
						if (asset.type == 'Image') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: workbookId,
								WorksheetId: create_worksheet.id,
							});
						} else if (asset.type != 'Document') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: workbookId,
								WorksheetId: create_worksheet.id,
								vmoVideoId: asset.vmoVideoId,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								isTranscoding: asset.Transcoding,
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
							});
						}
					}
					[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}

				// Add Worksheet Ofline Brief Asset
				if (worksheet.briefFiles && worksheet.briefFiles.length > 0) {
					let assets = [];
					for (let asset of worksheet.briefFiles) {
						if (asset.type == 'Image') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: workbookId,
								WorksheetId: create_worksheet.id,
								forBrief: asset && asset.forBrief ? asset.forBrief : false,
							});
						} else {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: workbookId,
								WorksheetId: create_worksheet.id,
								vmoVideoId: asset.vmoVideoId,
								cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
								isTranscoding: asset.Transcoding,
								forBrief: asset && asset.forBrief ? asset.forBrief : false,
								MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
								MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
							});
						}
					}
					[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}

				let createDocAsset;
				// Add worksheet learning Content
				if (worksheet.pdfFiles && worksheet.pdfFiles.length > 0) {
					let assets = [];
					for (let asset of worksheet.pdfFiles) {
						if (asset.type == 'Document') {
							assets.push({
								path: asset.path,
								fileName: asset.fileName,
								type: asset.type,
								ClientId: clientId,
								WorkbookId: workbookId,
								WorksheetId: create_worksheet.id,
							});
						}
					}

					[err, createDocAsset] = await to(DiwoAsset.bulkCreate(assets));
					if (err) return ResponseError(res, err, 500, true);
				}

				console.log('createDocAsset', createDocAsset);

				//Create Spin The Wheel question Category
				if (
					worksheet &&
					worksheet.type == 'Spin The Wheel' &&
					worksheet.spinWheelQueCategory &&
					worksheet.spinWheelQueCategory.length > 0
				) {
					let spinWheelQueCategory = [];
					for (let question_category of worksheet.spinWheelQueCategory) {
						// Create Question Category
						spinWheelQueCategory.push({
							WorkbookId: workbookId,
							WorksheetId: create_worksheet.id,
							category_index: question_category.category_index,
							category_name: question_category.category_name.trimStart().trimEnd(),
							totalquestion: question_category.totalquestion,
							totalscore: question_category.totalscore,
							characterRemain: question_category.characterRemain,
						});
					}

					[err, createSpinCategory] = await to(DiwoSpinWheelCat.bulkCreate(spinWheelQueCategory, { returning: true }));
					if (err) return ResponseError(res, err, 500, true);

					// Iterate over each Spin Category
					for (const queCategory_ of createSpinCategory) {
						const queCategory = queCategory_.convertToJSON();
						for (let question of worksheet.Questions) {
							if (queCategory.category_index === question.spinCatIndex) {
								question.DiwoSpinWheelCatId = queCategory.id;
							}
						}
					}
				}

				//survey question group
				if (
					worksheet &&
					worksheet.type == 'Survey' &&
					worksheet.question_Group &&
					worksheet.questionGroups &&
					worksheet.questionGroups.length > 0
				) {
					let questiongroup = [];
					for (let question_group of worksheet.questionGroups) {
						// Create QuestionGroup
						questiongroup.push({
							WorkbookId: workbookId,
							WorksheetId: create_worksheet.id,
							index: question_group.index,
							group_name: question_group.group_name,
						});
					}

					let createsurveyGroup;

					[err, createsurveyGroup] = await to(SurveyQueGroup.bulkCreate(questiongroup, { returning: true }));
					if (err) return ResponseError(res, err, 500, true);

					// Iterate over each survey group
					for (const queSurvey_ of createsurveyGroup) {
						// Convert the current survey group to JSON format
						const queSurvey = queSurvey_.convertToJSON();

						// Iterate over each question in the worksheet
						for (let question of worksheet.Questions) {
							// Check if the group index of the current survey group matches the question's group index
							if (queSurvey.index === question.group_index) {
								// Update the SurveyQueGroupId of the question with the ID of the current survey group
								question.SurveyQueGroupId = queSurvey.id;
							}
						}
					}
				}

				for (let question of worksheet.Questions) {
					// Create Question
					question.ClientId = clientId;
					question.WorkbookId = workbookId;
					question.WorksheetId = create_worksheet.id;
					question.allowFileTypes = question.allowFileTypes.toString();
					question.surveyCharLimit = question.surveyCharcterLimit ? parseInt(question.surveyCharcterLimit) : null;
					if (typeof question.userRatingArray !== 'string') {
						question.userRatingArray =
							Array.isArray(question.userRatingArray) &&
							question.userRatingArray.length > 0 &&
							question.userRatingArray[0] != null
								? question.userRatingArray.toString()
								: '';
					}

					if (question.questionType == 'Rating scale') {
						question.SurveyRatingType = question.SurveyRatingType ? question.SurveyRatingType : null;
						question.ratingMinLabel = question.ratingMinLabel ? question.ratingMinLabel : null;
						question.ratingMaxLabel = question.ratingMaxLabel ? question.ratingMaxLabel : null;
						if (typeof question.userRatingArray !== 'string') {
							question.userRatingArray =
								Array.isArray(question.userRatingArray) &&
								question.userRatingArray.length > 0 &&
								question.userRatingArray[0] != null
									? question.userRatingArray.toString()
									: '';
						}
					}

					delete question.id;
					[err, create_question] = await to(Question.create(question));
					if (err) return ResponseError(res, err, 500, true);

					if (question.DiwoAssets && question.DiwoAssets.length > 0) {
						let assets = [];
						for (let asset of question.DiwoAssets) {
							if (asset.type == 'Image') {
								assets.push({
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									ClientId: clientId,
									WorkbookId: workbookId,
									QuestionId: create_question.id,
								});
							} else {
								assets.push({
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									ClientId: clientId,
									WorkbookId: workbookId,
									QuestionId: create_question.id,
									vmoVideoId: asset.vmoVideoId,
									cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
									isTranscoding: asset.Transcoding,
									MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
									MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
								});
							}
						}
						[err, createAsset] = await to(DiwoAsset.bulkCreate(assets));
						if (err) return ResponseError(res, err, 500, true);
					}
					if (worksheet.type != 'Content') {
						let sequence = 1;
						for (let option of question.Options) {
							//Create Option
							option.ClientId = clientId;
							option.WorkbookId = workbookId;
							option.WorksheetId = create_worksheet.id;
							option.QuestionId = create_question.id;
							option.sr_no = sequence;
							[err, create_option] = await to(Option.create(option));
							if (err) return ResponseError(res, err, 500, true);
							sequence++;
						}
					}
				}
			}
		}

		// [err, workbook] = await to(
		// 	Workbook.findOne({
		// 		where: {
		// 			id: workbookId,
		// 		},
		// 		include: [
		// 			{
		// 				model: DiwoAsset,
		// 			},
		// 			{
		// 				model: Worksheet,
		// 				include: [
		// 					{
		// 						model: DiwoAsset,
		// 					},
		// 					{
		// 						model: Question,
		// 						include: [
		// 							{
		// 								model: DiwoAsset,
		// 							},
		// 							{
		// 								model: Option,
		// 							},
		// 						],
		// 					},
		// 				],
		// 			},
		// 		],
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;
		let notifcationMessage = MESSAGE.WORKBOOK_UPDATE_NOTIFICATION;
		notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
		notifcationMessage = notifcationMessage.replace('{{workbook_name}}', workbook_details.title);
		let userIds = await getAllDiwoUserIdsForNotification(parseInt(clientId));
		const index = userIds.indexOf(req.user.id);
		if (index !== -1) {
			userIds.splice(index, 1);
		}
		await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
		let notifcationMessageForUser = MESSAGE.WORKBOOK_UPDATE_NOTIFICATION;
		notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
		notifcationMessageForUser = notifcationMessageForUser.replace('{{workbook_name}}', workbook_details.title);
		await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Update Workbook`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					WorkbookId: workbookId,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		updateMediaCMSStatusInDiwoAssets(workbookId);

		return ResponseSuccess(res, {
			message: notifcationMessageForUser,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.updateWorkbook = updateWorkbook;

const deletePreviousVersionOfWorkbook = async function (workbookId, newWorkbookId) {
	try {
		let deleteSessionUser, err;
		[err, deleteSessionUser] = await to(
			SessionUser.findAll({
				where: {
					WorkbookId: workbookId,
					status: 'Pre Assign',
				},
				include: [
					{
						model: SessionWorksheet,
						attributes: ['id', 'SessionUserId'],
						include: [
							{
								model: SessionQuestion,
								attributes: ['id', 'SessionWorksheetId'],
								include: [
									{
										model: SessionOption,
										attributes: ['id', 'SessionQuestionId'],
									},
									{
										model: SessionAsset,
										attributes: ['id', 'SessionWorksheetId', 'SessionUserId', 'SessionQuestionId'],
									},
								],
							},
							{ model: SessionAsset, attributes: ['id', 'SessionWorksheetId', 'SessionUserId', 'SessionQuestionId'] },
						],
					},
					{ model: SessionAsset, attributes: ['id', 'SessionWorksheetId', 'SessionUserId', 'SessionQuestionId'] },
				],
				attributes: [
					'id',
					'WorkbookId',
					'status',
					'UserId',
					'ClientId',
					'DiwoAssignmentId',
					'DiwoModuleAssignId',
					'forTrainer',
				],
			})
		);
		// if (err) return ResponseError(res, err, 500, true);
		if (err) {
			console.log('------deleteSessionUser-----err--', err);
		}

		let learnerIdAndOtherDetails = [];
		let sessionUserId = [];
		let seesionWorksheetId = [];
		let sessionQuestionId = [];
		let sessionOptionId = [];
		let sessionAssetId = [];
		for (let item of deleteSessionUser) {
			let sessionUser = item.convertToJSON();

			learnerIdAndOtherDetails.push({
				UserId: item.UserId,
				ClientId: item.ClientId,
				DiwoAssignmentId: item.DiwoAssignmentId,
				DiwoModuleAssignId: item.DiwoModuleAssignId,
				forTrainer: item.forTrainer,
			});

			sessionUserId.push(sessionUser.id);
			//SessionUser Asset
			if (sessionUser?.SessionAssets?.length > 0) {
				for (let asset of sessionUser.SessionAssets) {
					sessionAssetId.push(asset.id);
				}
			}

			//For SessionWorsheet
			for (let sessionWorksheet of item.SessionWorksheets) {
				seesionWorksheetId.push(sessionWorksheet.id);

				//For SessionWorsheet Asset
				if (sessionWorksheet?.SessionAssets?.length > 0) {
					for (let asset of sessionWorksheet.SessionAssets) {
						sessionAssetId.push(asset.id);
					}
				}

				//For SessionQuestion Asset
				if (sessionWorksheet?.SessionQuestions?.length > 0) {
					for (let question of sessionWorksheet.SessionQuestions) {
						sessionQuestionId.push(question.id);

						if (question?.SessionAssets?.length > 0) {
							for (let asset of question.SessionAssets) {
								sessionAssetId.push(asset.id);
							}
						}

						//For SessionOption Asset
						if (question?.SessionOptions?.length > 0) {
							for (let option of question.SessionOptions) {
								sessionOptionId.push(option.id);
							}
						}
					}
				}
			}
		}

		//Delete SessionAssets
		if (sessionAssetId.length > 0) {
			[err, deleteAssets] = await to(
				SessionAsset.destroy({
					where: {
						id: sessionAssetId,
					},
				})
			);
			if (err) {
				console.log('-----Error --deleteAssets--', err);
			}
		}

		//Delete SessionOptions
		if (sessionOptionId.length > 0) {
			[err, deleteOptions] = await to(
				SessionOption.destroy({
					where: {
						id: sessionOptionId,
					},
				})
			);
			if (err) {
				console.log('-----Error --deleteOptions--', err);
			}
		}

		//Delete SessionQuestion
		if (sessionQuestionId.length > 0) {
			[err, deleteQuestions] = await to(
				SessionQuestion.destroy({
					where: {
						id: sessionQuestionId,
					},
				})
			);
			if (err) {
				console.log('-----Error --deleteQuestions--', err);
			}
		}

		//Delete SessionWorksheets
		if (seesionWorksheetId.length > 0) {
			[err, deleteWorksheet] = await to(
				SessionWorksheet.destroy({
					where: {
						id: seesionWorksheetId,
					},
				})
			);
			if (err) {
				console.log('-----Error --deleteWorksheet--', err);
			}
		}

		//Delete SessionUser
		if (sessionUserId.length > 0) {
			[err, deleteSessionUsers] = await to(
				SessionUser.destroy({
					where: {
						id: sessionUserId,
					},
				})
			);
			if (err) {
				console.log('-----Error --deleteSessionUsers--', err);
			}
		}

		if (learnerIdAndOtherDetails.length > 0) {
			//Get Workbook and All Worksheet Data
			// Get Workbook Data
			let workbookDetails;
			[err, workbookDetails] = await to(
				Workbook.findOne({
					where: {
						id: newWorkbookId,
					},
					include: [
						{
							model: Worksheet,
							include: [
								{
									model: DiwoAsset,
								},
							],
						},
					],
					order: [
						[
							{
								model: Worksheet,
							},
							'id',
							'ASC',
						],
					],
				})
			);
			if (err) {
				console.log('----Error---newWorkbookId--', err);
			}

			if (workbookDetails) {
				let allowNewLearners = [];
				let learnerIds = [];
				let list = [];
				for (let learner of learnerIdAndOtherDetails) {
					let payload = {
						WorkbookId: newWorkbookId,
						UserId: learner.UserId,
						status: 'Pre Assign',
						title: workbookDetails.title,
						descrip: workbookDetails.descrip,
						ClientId: learner.ClientId,
						forTrainer: learner.forTrainer,
						isPreAssigned: true,
						newRegister: false,
						isAppliedBadge: workbookDetails.isAppliedBadge,
						isAppliedCertificate: workbookDetails.isAppliedCertificate,
						haveCertificate: workbookDetails.haveCertificate,
						BadgeId: workbookDetails.BadgeId,
						// CertificateId: workbookDetails.CertificateId,
						CertificateLine1: workbookDetails.CertificateLine1,
						CertificateLine2: workbookDetails.CertificateLine2,
						CertificateLine3: workbookDetails.CertificateLine3,
						certificateData: workbookDetails.certificateData,
						condition: workbookDetails.condition,
						ModuleStatus: 'Not Started',
						isAllowedPDF: workbookDetails.isAllowedPDF,
						DiwoAssignmentId: learner.DiwoAssignmentId,
						DiwoModuleAssignId: learner.DiwoModuleAssignId,
					};
					list.push(payload);

					//Batching Of 50 Leanrer SessionUser data.
					if (list.length == 50) {
						console.log('-----------Batching---50  SessionUser----------');
						[err, temp] = await to(
							SessionUser.bulkCreate(list, {
								returning: true,
							})
						);
						if (err) {
							console.log('----------SessionUser Batch----1------------', err);
						}

						for (let item of temp) {
							allowNewLearners.push(item.convertToJSON());
						}
						list = [];
					}
				}

				if (list.length > 0) {
					console.log('-----------Builk Create  SessionUser----------');

					[err, temp] = await to(
						SessionUser.bulkCreate(list, {
							returning: true,
						})
					);
					if (err) {
						console.log('----------SessionUser Batch----2------------', err);
					}

					for (let item of temp) {
						allowNewLearners.push(item.convertToJSON());
					}
				}

				if (allowNewLearners.length > 0) {
					let workBookAssets = [];

					[err, workBookAssets] = await to(
						DiwoAsset.findAll({
							where: {
								WorkbookId: newWorkbookId,
								WorksheetId: {
									[Op.eq]: null,
								},
								QuestionId: {
									[Op.eq]: null,
								},
							},
						})
					);
					if (err) {
						console.log('-----Error----Getting DiwoAssets--', err);
					}

					if (workBookAssets && workBookAssets.length > 0) {
						let sessionWorkBookAsset = [];

						for (let workBookAsset of workBookAssets) {
							for (let allowNewLearner of allowNewLearners) {
								sessionWorkBookAsset.push({
									ClientId: allowNewLearner.ClientId,
									SessionUserId: allowNewLearner.id,
									path: workBookAsset.path,
									filename: workBookAsset.fileName,
									type: workBookAsset.type,
									forBrief: workBookAsset.forBrief,
								});

								//Batching of 50 Record
								if (sessionWorkBookAsset.length == 50) {
									[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
									if (err) {
										console.log('-----Error----sessionWorkbookAssets----1---', err);
									}

									sessionWorkBookAsset = [];
								}
							}
						}

						if (sessionWorkBookAsset?.length > 0) {
							[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
							if (err) {
								console.log('-----Error----sessionWorkbookAssets----2---', err);
							}
						}
					}

					let workbookDetail_ = workbookDetails.convertToJSON();
					for (let worksheet_ of workbookDetail_.Worksheets) {
						let question;
						[err, question] = await to(
							Question.findAll({
								where: {
									WorksheetId: worksheet_.id,
								},
								include: [
									{
										model: DiwoAsset,
									},
									{
										model: Option,
									},
									{
										model: SurveyQueGroup,
									},
									{
										model: DiwoSpinWheelCat,
									},
								],
								order: [
									['id', 'ASC'],
									[
										{
											model: Option,
										},
										'id',
										'ASC',
									],
								],
							})
						);
						if (err) {
							console.log('----------question 12------------', err);
						}

						worksheet_.Questions = question;
					}

					for (let data of allowNewLearners) {
						let index = 0;
						for (let worksheet of workbookDetail_.Worksheets) {
							let createSessionWorksheet;
							let worksheetPayload = { ...worksheet };
							worksheetPayload.WorksheetId = worksheet.id;
							delete worksheetPayload.id;
							delete worksheetPayload.createdAt;
							delete worksheetPayload.updatedAt;

							worksheetPayload.SessionUserId = data.id;
							worksheetPayload.SessionId = null;
							worksheetPayload.ClientId = null;
							worksheetPayload.index = index;
							worksheetPayload.worksheetStatus = 'Not Started';

							[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
							if (err) {
								console.log('----------createSessionWorksheet 1------------', err);
							}

							if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
								let assetList = [];
								for (let asset of worksheet.DiwoAssets) {
									let payload = {
										ClientId: workbookDetails.ClientId,
										SessionWorksheetId: createSessionWorksheet.id,
										path: asset.path,
										fileName: asset.fileName,
										type: asset.type,
										forBrief: asset.forBrief,
									};
									assetList.push(payload);
								}
								[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
								if (err) {
									console.log('----------addAsset 1------------', err);
								}
							}

							index++;
							let randomData;
							if (worksheet.type == 'Quiz (Randomised)') {
								const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
								randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
							} else {
								randomData = worksheet.Questions;
							}

							for (let question of randomData) {
								let createSessionQuestion;

								let questionPayload = question.convertToJSON();
								questionPayload.QuestionId = questionPayload.id;
								questionPayload.ClientId = null;
								questionPayload.SessionWorksheetId = createSessionWorksheet.id;

								questionPayload.queGroupIndex = question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null;
								questionPayload.queGroupName = question?.SurveyQueGroup?.group_name
									? question.SurveyQueGroup.group_name
									: null;
								questionPayload.spinCatIndex = question?.DiwoSpinWheelCat?.category_index
									? question.DiwoSpinWheelCat.category_index
									: null;
								questionPayload.spinCatName = question?.DiwoSpinWheelCat?.category_name
									? question.DiwoSpinWheelCat.category_name
									: null;

								delete questionPayload.id;
								delete questionPayload.createdAt;
								delete questionPayload.updatedAt;

								[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
								if (err) {
									console.log('----------createSessionQuestion 1------------', err);
								}

								if (question.DiwoAssets && question.DiwoAssets.length > 0) {
									let assetList2 = [];
									for (let asset of question.DiwoAssets) {
										let payload = asset;
										payload.SessionQuestionId = createSessionQuestion.id;
										delete payload.id;
										delete payload.createdAt;
										delete payload.updatedAt;
										assetList2.push(payload);
									}

									[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
									if (err) {
										console.log('----------addAsset 2------------', err);
									}
								}

								let optionPayload = [];
								for (let option of question.Options) {
									let payload = option.convertToJSON();

									delete payload.id;
									delete payload.createdAt;
									delete payload.updatedAt;

									payload.correctAns = option.isCorrectAnswer;
									payload.selectedAns = option.userSelectedAns;
									payload.SessionQuestionId = createSessionQuestion.id;
									payload.OptionId = option.id;
									payload.SessionWorksheetId = createSessionWorksheet.id;
									optionPayload.push(payload);
								}

								[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
								if (err) {
									console.log('----------createSessionOption 1------------', err);
								}
							}
						}
					}
				}
			}
		}
		/////////////////////////////////////////////////////////////////////////////
	} catch (error) {
		console.log('----deletePreviousVersionOfWorkbook---error--', error);
	}
};
module.exports.deletePreviousVersionOfWorkbook = deletePreviousVersionOfWorkbook;

const getRandomDataFromArray = async function (dataArray, numberOfRecords) {
	try {
		const shuffledArray = [...dataArray];
		for (let i = shuffledArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
		}
		const randomRecords = shuffledArray.slice(0, numberOfRecords);
		return randomRecords;
	} catch {
		return [];
	}
};

const preAssignmentWorkbook = async function (req, res) {
	try {
		preAssignmentAllWorkbookAndWorksheet(req, res);
		return ResponseSuccess(res, {
			message: MESSAGE.WORKBOOK_UPDATED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.preAssignmentWorkbook = preAssignmentWorkbook;

const preAssignmentAllWorkbookAndWorksheet = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			workbookId: Joi.number().integer().positive().min(1).required(),
			learnerGroupIds: Joi.array().items(Joi.number().integer().positive()).optional().allow(null).allow(''),
			trainerIds: Joi.array().items(Joi.number().integer().positive()).optional().allow(null).allow(''),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			workbookId: parseInt(req.params.workbookId),
			learnerGroupIds: req.body.learnerGroupIds,
			trainerIds: req.body.trainerIds,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, workbookId, learnerGroupIds, trainerIds } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let userId = req.user.id;
		// let workbookId = parseInt(req.params.workbookId);
		// let clientId = parseInt(req.params.clientId);
		// let learnerGroupIds = req.body.learnerGroupIds;
		let groupLearner = [];
		let learnerIds = [];
		let allowNewLearners = [];
		let temp = [];
		let exstingSessionUserIds = [];
		let learner_user_ids = [];

		//console.log('-clientId-', clientId);
		//console.log('-workbookId-', workbookId);
		//console.log('-learnerGroupIds-', learnerGroupIds);
		//console.log('-trainerIds-', trainerIds);

		[err, workbookDetails] = await to(
			Workbook.findOne({
				where: {
					id: workbookId,
				},
				// include: [{ model: Course, attributes: ['title'] }],
				include: [
					{
						model: Worksheet,
						include: [
							{
								model: DiwoAsset,
							},
						],
					},
				],
				order: [
					[
						{
							model: Worksheet,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (learnerGroupIds && learnerGroupIds.length > 0) {
			[err, groupLearner] = await to(
				User.findAll({
					where: {
						is_deleted: false,
						cStatus: 'Active',
						forDiwo: true,
					},
					include: [
						{
							model: User_group,
							through: 'User_group_mapping',
							where: {
								id: learnerGroupIds,
								forDiwo: true,
							},
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let incomingWorkbookId = [workbookId];

			const sessionUserQuery = `
				SELECT "UserId"
				FROM "SessionUsers"
				WHERE "status" = 'Pre Assign' 
				AND "forTrainer" = false
				AND "WorkbookId" IN (:workbookIds);
				`;

			const exstingSessionUsers_Id = await sequelize.query(sessionUserQuery, {
				replacements: {
					workbookIds: incomingWorkbookId, // Use the array for WorkbookIds
				},
			});

			for (let data of exstingSessionUsers_Id[0]) {
				exstingSessionUserIds.push(data.UserId);
			}

			for (let learner of groupLearner) {
				if (!learner_user_ids.includes(learner.id)) learner_user_ids.push(learner.id);
			}

			let list = [];
			// Handle exstingSessionUsersId that are not in learner_user_ids
			// for (let learnerId of exstingSessionUserIds) {
			// 	if (learner_user_ids.indexOf(learnerId) === -1) {
			// 		let payload = {
			// 			WorkbookId: workbookId,
			// 			UserId: learnerId,
			// 			status: 'Pre Assign',
			// 			title: workbookDetails.title,
			// 			descrip: workbookDetails.descrip,
			// 			ClientId: clientId,
			// 			forTrainer: false,
			// 			isPreAssigned: true,
			// 			newRegister: false,
			// 			isAppliedBadge: workbookDetails.isAppliedBadge,
			// 			isAppliedCertificate: workbookDetails.isAppliedCertificate,
			// 			haveCertificate: workbookDetails.haveCertificate,
			// 			BadgeId: workbookDetails.BadgeId,
			// 			// CertificateId: workbookDetails.CertificateId,
			// 			CertificateLine1: workbookDetails.CertificateLine1,
			// 			CertificateLine2: workbookDetails.CertificateLine2,
			// 			CertificateLine3: workbookDetails.CertificateLine3,
			// 			certificateData: workbookDetails.certificateData,
			// 			condition: workbookDetails.condition,
			// 		};
			// 		list.push(payload);
			// 	}
			// 	learnerIds.push(learnerId);
			// }

			// Handle learner_user_ids that are not in exstingSessionUsersId
			for (let learnerId of learner_user_ids) {
				if (exstingSessionUserIds.indexOf(learnerId) === -1) {
					let payload = {
						WorkbookId: workbookId,
						UserId: learnerId,
						status: 'Pre Assign',
						title: workbookDetails.title,
						descrip: workbookDetails.descrip,
						ClientId: clientId,
						forTrainer: false,
						isPreAssigned: true,
						newRegister: false,
						isAppliedBadge: workbookDetails.isAppliedBadge,
						isAppliedCertificate: workbookDetails.isAppliedCertificate,
						haveCertificate: workbookDetails.haveCertificate,
						BadgeId: workbookDetails.BadgeId,
						// CertificateId: workbookDetails.CertificateId,
						CertificateLine1: workbookDetails.CertificateLine1,
						CertificateLine2: workbookDetails.CertificateLine2,
						CertificateLine3: workbookDetails.CertificateLine3,
						certificateData: workbookDetails.certificateData,
						condition: workbookDetails.condition,
						ModuleStatus: 'Not Started',
						isAllowedPDF: workbookDetails.isAllowedPDF,

						isAddSignature: workbookDetails.isAddSignature,

						signatureName1: workbookDetails.signatureName1,
						signatureDesignation1: workbookDetails.signatureDesignation1,
						signaturePath1: workbookDetails.signaturePath1,
						signaturePathName1: workbookDetails.signaturePathName1,

						signatureName2: workbookDetails.signatureName2,
						signatureDesignation2: workbookDetails.signatureDesignation2,
						signaturePath2: workbookDetails.signaturePath2,
						signaturePathName2: workbookDetails.signaturePathName2,
					};
					list.push(payload);

					//Batching Of 50 Leanrer SessionUser data.
					if (list.length == 50) {
						console.log('-----------Batching---50  SessionUser----------');
						[err, temp] = await to(
							SessionUser.bulkCreate(list, {
								returning: true,
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						for (let item of temp) {
							allowNewLearners.push(item.convertToJSON());
						}
						list = [];
					}
				}
				learnerIds.push(learnerId);
			}

			//Pre Assignment
			// let list = [];
			// let userId = [];
			// for (let learner of groupLearner) {
			// 	list.push({
			// 		WorkbookId: workbookId,
			// 		UserId: learner.id,
			// 		status: 'Pre Assign',
			// 		title: workbookDetails.title,
			// 		descrip: workbookDetails.descrip,
			// 		ClientId: clientId,
			// 		forTrainer: false,
			// 		isPreAssigned: true,
			// 		newRegister: false,
			// 	});
			// 	learnerIds.push(learner.id);
			// 	// Check License
			// 	// let flag = await getValidationForAssignWorkbook(clientId);
			// 	// if (flag) {
			// 	//     userId.push(learner.id);
			// 	//     await getAddOneWorkbookInLicense(clientId);
			// 	// }
			// }

			//For Trainer
			// list.push({
			//     WorkbookId: workbookId,
			//     UserId: null,
			//     status: 'Pre Assign',
			//     title: workbookDetails.title,
			//     descrip: workbookDetails.descrip,
			//     ClientId: clientId,
			//     forTrainer: true
			// });

			// Check For License

			// [err, OldCount] = await to(SessionUser.count({
			//     where: {
			//         UserId: userId,
			//         WorkbookId: workbookId,
			//         SessionId: null,
			//         status: 'Pre Assign',
			//     },
			// }));
			// if (err) return ResponseError(res, err, 500, true);
			// if (OldCount) {
			//     await getRemoveWorkbookByCount(clientId, OldCount);
			//     [err, destroyOldPreAssign] = await to(SessionUser.destroy({
			//         where: {
			//             UserId: userId,
			//             WorkbookId: workbookId,
			//             SessionId: null,
			//             status: 'Pre Assign',

			//         },
			//     }));
			//     if (err) return ResponseError(res, err, 500, true);
			// }

			if (list.length > 0) {
				console.log('-----------Builk Create  SessionUser----------');

				[err, temp] = await to(
					SessionUser.bulkCreate(list, {
						returning: true,
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				for (let item of temp) {
					allowNewLearners.push(item.convertToJSON());
				}
			}

			[err, workBookAssets] = await to(
				DiwoAsset.findAll({
					where: {
						WorkbookId: workbookId,
						WorksheetId: {
							[Op.eq]: null,
						},
						QuestionId: {
							[Op.eq]: null,
						},
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (workBookAssets && workBookAssets.length > 0) {
				let sessionWorkBookAsset = [];

				for (let workBookAsset of workBookAssets) {
					for (let allowNewLearner of allowNewLearners) {
						sessionWorkBookAsset.push({
							ClientId: clientId,
							SessionUserId: allowNewLearner.id,
							path: workBookAsset.path,
							filename: workBookAsset.fileName,
							type: workBookAsset.type,
							forBrief: workBookAsset.forBrief,
							isTranscoding: workBookAsset.isTranscoding,
							vmoVideoId: workBookAsset.vmoVideoId ? workBookAsset.vmoVideoId : null,
							cmsVideoId: workBookAsset.cmsVideoId ? workBookAsset.cmsVideoId : null,
							MediaCMSUploadQueueId: workBookAsset.MediaCMSUploadQueueId ? workBookAsset.MediaCMSUploadQueueId : null,
							MediaUploadStatus: workBookAsset.MediaUploadStatus ? workBookAsset.MediaUploadStatus : null,
						});

						//Batching of 50 Record
						if (sessionWorkBookAsset.length == 50) {
							[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
							if (err) return ResponseError(res, err, 500, true);
							sessionWorkBookAsset = [];
						}
					}
				}

				if (sessionWorkBookAsset?.length > 0) {
					[err, sessionWorkbookAssets] = await to(SessionAsset.bulkCreate(sessionWorkBookAsset));
					if (err) return ResponseError(res, err, 500, true);
				}
			}

			//Add Records into SessionWorksheets, SessionQuestion, SessionOption, SessionAssets
			// workbookDetails
			if (workbookDetails) {
				let workbookDetail_ = workbookDetails.convertToJSON();
				for (let worksheet_ of workbookDetail_.Worksheets) {
					let question;
					[err, question] = await to(
						Question.findAll({
							where: {
								WorksheetId: worksheet_.id,
							},
							include: [
								{
									model: DiwoAsset,
								},
								{
									model: Option,
								},
								{
									model: SurveyQueGroup,
								},
								{
									model: DiwoSpinWheelCat,
								},
							],
							order: [
								['id', 'ASC'],
								[
									{
										model: Option,
									},
									'id',
									'ASC',
								],
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					worksheet_.Questions = question;
				}

				for (let data of allowNewLearners) {
					let index = 0;
					for (let worksheet of workbookDetail_.Worksheets) {
						let createSessionWorksheet;
						let worksheetPayload = { ...worksheet };
						worksheetPayload.WorksheetId = worksheet.id;
						delete worksheetPayload.id;
						delete worksheetPayload.createdAt;
						delete worksheetPayload.updatedAt;

						worksheetPayload.SessionUserId = data.id;
						worksheetPayload.SessionId = null;
						worksheetPayload.ClientId = null;
						worksheetPayload.index = index;
						worksheetPayload.worksheetStatus = 'Not Started';

						[err, createSessionWorksheet] = await to(SessionWorksheet.create(worksheetPayload));
						if (err) return ResponseError(res, err, 500, true);

						if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
							let assetList = [];
							for (let asset of worksheet.DiwoAssets) {
								let payload = {
									ClientId: workbookDetails.ClientId,
									SessionWorksheetId: createSessionWorksheet.id,
									path: asset.path,
									fileName: asset.fileName,
									type: asset.type,
									forBrief: asset.forBrief,
									isTranscoding: asset.isTranscoding,
									vmoVideoId: asset.vmoVideoId ? asset.vmoVideoId : null,
									cmsVideoId: asset.cmsVideoId ? asset.cmsVideoId : null,
									MediaCMSUploadQueueId: asset.MediaCMSUploadQueueId ? asset.MediaCMSUploadQueueId : null,
									MediaUploadStatus: asset.MediaUploadStatus ? asset.MediaUploadStatus : null,
								};
								assetList.push(payload);
							}
							[err, addAsset] = await to(SessionAsset.bulkCreate(assetList));
							if (err) return ResponseError(res, err, 500, true);
						}

						index++;
						let randomData;
						if (worksheet.type == 'Quiz (Randomised)') {
							const numberOfRecordsToRetrieve = worksheet.quizRandCount ? worksheet.quizRandCount : 20;
							randomData = await getRandomDataFromArray(worksheet.Questions, numberOfRecordsToRetrieve);
						} else {
							randomData = worksheet.Questions;
						}

						for (let question of randomData) {
							let createSessionQuestion;

							let questionPayload = question.convertToJSON();
							questionPayload.QuestionId = questionPayload.id;
							questionPayload.ClientId = null;
							questionPayload.SessionWorksheetId = createSessionWorksheet.id;

							questionPayload.queGroupIndex = question?.SurveyQueGroup?.index ? question.SurveyQueGroup.index : null;
							questionPayload.queGroupName = question?.SurveyQueGroup?.group_name
								? question.SurveyQueGroup.group_name
								: null;
							questionPayload.spinCatIndex = question?.DiwoSpinWheelCat?.category_index
								? question.DiwoSpinWheelCat.category_index
								: null;
							questionPayload.spinCatName = question?.DiwoSpinWheelCat?.category_name
								? question.DiwoSpinWheelCat.category_name
								: null;

							questionPayload.SurveyRatingType = question?.SurveyRatingType ? question.SurveyRatingType : null;

							questionPayload.ratingMinLabel = question?.ratingMinLabel ? question.ratingMinLabel : null;

							questionPayload.ratingMaxLabel = question?.ratingMaxLabel ? question.ratingMaxLabel : null;

							if (typeof question.userRatingArray !== 'string') {
								question.userRatingArray =
									Array.isArray(question.userRatingArray) &&
									question.userRatingArray.length > 0 &&
									question.userRatingArray[0] != null
										? question.userRatingArray.toString()
										: '';
							}

							delete questionPayload.id;
							delete questionPayload.createdAt;
							delete questionPayload.updatedAt;

							[err, createSessionQuestion] = await to(SessionQuestion.create(questionPayload));
							if (err) return ResponseError(res, err, 500, true);

							if (question.DiwoAssets && question.DiwoAssets.length > 0) {
								let assetList2 = [];
								for (let asset of question.DiwoAssets) {
									let payload = asset.convertToJSON();

									payload.SessionQuestionId = createSessionQuestion.id;
									delete payload.id;
									delete payload.createdAt;
									delete payload.updatedAt;
									assetList2.push(payload);
								}

								[err, addAsset] = await to(SessionAsset.bulkCreate(assetList2));
								if (err) return ResponseError(res, err, 500, true);
							}

							let optionPayload = [];
							for (let option of question.Options) {
								let payload = option.convertToJSON();

								delete payload.id;
								delete payload.createdAt;
								delete payload.updatedAt;

								payload.correctAns = option.isCorrectAnswer;
								payload.selectedAns = option.userSelectedAns;
								payload.SessionQuestionId = createSessionQuestion.id;
								payload.OptionId = option.id;
								payload.SessionWorksheetId = createSessionWorksheet.id;
								optionPayload.push(payload);
							}

							[err, createSessionOption] = await to(SessionOption.bulkCreate(optionPayload));
							if (err) return ResponseError(res, err, 500, true);
						}
					}
				}
			}

			/////////////////////////////////////////////Notification//////////////////////////////////////////
			//For Notification
			[err, getUserData] = await to(
				User.findOne({
					where: {
						id: userId,
					},
					attributes: ['local_user_id', 'MarketId'],
					include: [
						{
							model: Market,
							attributes: ['db_name'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, localUserData] = await to(
				dbInstance[getUserData.Market.db_name].User_master.findOne({
					where: {
						id: getUserData.local_user_id,
					},
					attributes: ['first', 'last', 'email'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
			const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
			const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			// const userName = localUserData.first + localUserData.last ? localUserData.last : '';

			let userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
				localUserData && localUserData.last ? localUserData.last : ''
			}`;

			let notifcationMessage_1 = MESSAGE.WORKBOOK_PREASSIGN_NOTIFICATION_1;
			notifcationMessage_1 = notifcationMessage_1.replace('{{count}}', groupLearner.length);
			notifcationMessage_1 = notifcationMessage_1.replace('{{workbook_name}}', workbookDetails.title);
			notifcationMessage_1 = notifcationMessage_1.replace('{{user_name}}', 'You');
			notifcationMessage_1 = notifcationMessage_1.replace(
				'{{learner}}',
				groupLearner.length === 1 ? 'Learner' : 'Learners'
			);
			await createNotificationforDiwo(notifcationMessage_1, ['Bell'], [userId]);

			let notifcationMessage_3 = MESSAGE.WORKBOOK_PRE_ASSIGNED_NOTIFICATION;
			notifcationMessage_3 = notifcationMessage_3.replace('{{count}}', groupLearner.length);
			notifcationMessage_3 = notifcationMessage_3.replace('{{workbook_name}}', workbookDetails.title);
			notifcationMessage_3 = notifcationMessage_3.replace('{{user_name}}', userName);
			await createNotificationforDiwo(notifcationMessage_3, ['Bell'], learnerIds);
		}

		if (learnerGroupIds && learnerGroupIds.length > 0) {
			[err, deleteGroup] = await to(
				WorkbookUserGroupMapping.destroy({
					where: {
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let userGroups = [];
			for (let userGroupid of req.body.learnerGroupIds) {
				userGroups.push({
					WorkbookId: workbookId,
					UserGroupId: userGroupid,
				});
			}
			[err, addUserGroup] = await to(WorkbookUserGroupMapping.bulkCreate(userGroups));
			if (err) return ResponseError(res, err, 500, true);
		}

		//For Notification
		[err, getUserData] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				attributes: ['local_user_id', 'MarketId'],
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUserData] = await to(
			dbInstance[getUserData.Market.db_name].User_master.findOne({
				where: {
					id: getUserData.local_user_id,
				},
				attributes: ['first', 'last', 'email'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		const appBrandingData = await getDiwoClientAppBrandingByClientId(clientId);
		const signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;

		let userName = `${localUserData && localUserData.first ? localUserData.first : ''} ${
			localUserData && localUserData.last ? localUserData.last : ''
		}`;

		// if (req.body.trainerIds && req.body.trainerIds.length > 0) {
		// [err, deleteTrainer] = await to(
		// 	WorkbookTrainerMapping.destroy({
		// 		where: {
		// 			WorkbookId: workbookId,
		// 			UserId: req.body.trainerIds,
		// 		},
		// 	})
		// );
		// if (err) return ResponseError(res, err, 500, true);
		// let userGroups = [];
		// for (let trainerId of req.body.trainerIds) {
		// 	userGroups.push({
		// 		WorkbookId: workbookId,
		// 		UserId: trainerId,
		// 	});
		// }
		// [err, addUserGroup] = await to(WorkbookTrainerMapping.bulkCreate(userGroups));
		// if (err) return ResponseError(res, err, 500, true);
		// }

		if (trainerIds && trainerIds.length > 0) {
			// Check existing records to avoid duplicates

			[err, existingMappings] = await to(
				WorkbookTrainerMapping.findAll({
					where: {
						WorkbookId: workbookId,
						UserId: trainerIds,
					},
					attributes: ['UserId'], // Fetch only UserId to compare
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// Extract existing trainer IDs using a normal loop
			const existingTrainerIds = [];
			for (let i = 0; i < existingMappings.length; i++) {
				existingTrainerIds.push(existingMappings[i].UserId);
			}

			let trainerWorkBooks = [];
			for (let i = 0; i < trainerIds.length; i++) {
				const trainerId = trainerIds[i];
				let isExisting = false;

				// Check if trainerId already exists in existingTrainerIds
				for (let j = 0; j < existingTrainerIds.length; j++) {
					if (trainerId === existingTrainerIds[j]) {
						isExisting = true;
						break;
					}
				}

				// Add to trainerWorkBooks only if not existing
				if (!isExisting) {
					trainerWorkBooks.push({
						WorkbookId: workbookId,
						UserId: trainerId,
					});
				}
			}

			// Bulk create only new records
			if (trainerWorkBooks.length > 0) {
				const [err, addUserGroup] = await to(WorkbookTrainerMapping.bulkCreate(trainerWorkBooks));
				if (err) return ResponseError(res, err, 500, true);
			}

			if (workbookDetails) {
				let notifcationMessage_2 = MESSAGE.WORKBOOK_PREASSIGN_NOTIFICATION_1;
				notifcationMessage_2 = notifcationMessage_2.replace('{{workbook_name}}', workbookDetails.title);
				notifcationMessage_2 = notifcationMessage_2.replace('{{count}}', groupLearner.length);
				notifcationMessage_2 = notifcationMessage_2.replace('{{user_name}}', userName);
				notifcationMessage_2 = notifcationMessage_2.replace(
					'{{learner}}',
					groupLearner.length === 1 ? 'Learner' : 'Learners'
				);
				await createNotificationforDiwo(notifcationMessage_2, ['Bell'], trainerIds);

				let finalEmailList = [];
				for (let user of trainerIds) {
					[err, getUser] = await to(
						User.findOne({
							where: {
								id: user,
							},
							attributes: ['local_user_id', 'MarketId'],
							include: [
								{
									model: Market,
									attributes: ['db_name'],
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					[err, localUser] = await to(
						dbInstance[getUser.Market.db_name].User_master.findOne({
							where: {
								id: getUser.local_user_id,
							},
							attributes: ['first', 'last', 'email'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					let personalisations = {};
					personalisations.to = localUser.email;
					// personalisations.to = 'nimkart.0212@gmail.com';
					if (personalisations.to != null && personalisations.to != '') {
						personalisations.dynamic_template_data = {
							first_name: localUser.first,
							user_name_who_assigned_workbook: userName,
							workbook_name: workbookDetails.title,
							// course_name: workbookDetails.Courses[0].title,
							client_signature: signature,
							// client_signature: 'https://app.staging.sendrip.com/images/uploads/assets/v3k4qSB8N_1700220152229.png',
							// client_signature: 'https://app.sendrip.com/images/uploads/assets/OagC0lvPS_1697956703989.png',
						};
						finalEmailList.push(personalisations);
					}
				}
				try {
					await notificationEmail(finalEmailList, 'Workbook Pre Assigned', clientId, 'diwo');
				} catch (error) {
					console.log('---error-notificationEmail- When Preassign to trainer---', error);
				}
			}
			// for mail trigger
			if (trainerIds && trainerIds.length > 0 && req.params.workbookId) {
				ModalAssignToTrainerLinkNotification(req, res);
			}

			[err, newLog] = await to(
				createlog(
					req.user.id,
					req.user.ClientId,
					req.user.RoleId,
					`Pre-Assigned Workbook`,
					req.ip,
					req.useragent,
					req.user.type,
					{
						WorkbookId: workbookId,
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
		}
	} catch (error) {
		console.log('-------Error --preAssignmentAllWorkbookAndWorksheet----------', error);
	}
};

const ModalAssignToTrainerLinkNotification = async function (req, res) {
	try {
		let finalEmailList = [];
		let userPayload = {};
		let projectName = '';

		for (let user of req.body.trainerIds) {
			[err, getUser] = await to(
				User.findOne({
					where: {
						id: user,
					},
					attributes: ['local_user_id', 'MarketId'],
					include: [
						{
							model: Market,
							attributes: ['db_name'],
						},
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, localUser] = await to(
				dbInstance[getUser.Market.db_name].User_master.findOne({
					where: {
						id: getUser.local_user_id,
					},
					attributes: ['first', 'last', 'email'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (localUser.email) {
				finalEmailList.push({
					to: localUser.email,
					dynamic_template_data: {
						first_name: localUser.first,
					},
				});
			}
		}

		let emailSignatureText = '';

		if (req.user.type == 'drip') {
			const appBrandingData = await getClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData.EmailSignatureText;
		} else if (req.user.type == 'diwo') {
			const appBrandingData = await getDiwoClientAppBrandingByClientId(req.user.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			emailSignatureText = appBrandingData.EmailSignatureText;
		}

		if (config_feature?.configurable_feature?.saas) {
			if (req.user.type == 'drip') {
				projectName = 'Drip';
			} else if (req.user.type == 'diwo') {
				projectName = 'Diwo';
			}
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		const WorkbookId = parseInt(req.params.workbookId);

		[err, workbookdetails] = await to(
			Workbook.findOne({
				where: {
					id: WorkbookId,
				},
				attributes: ['title'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		console.log('finalEmailList', finalEmailList);

		if (finalEmailList.length > 0 && WorkbookId) {
			for (let user of finalEmailList) {
				let userPayload = {
					email: user.to,
					firstName: user.dynamic_template_data.first_name,
					signature: emailSignatureText,
					projectName: projectName,
					workbookTitle: workbookdetails.title,
				};

				console.log('userPayload', userPayload);

				[err, mailedModalAssignedToTrainerText] = await to(sendModalAssignEmailToTrainer(userPayload, req.user.type));
				if (err) {
					console.log('--------Error in Sendgrid--------------', err);
					failed = 'e-mail';
				} else {
					success = 'e-mail';
				}

				// console.log('mailedModalAssignedToTrainerText', mailedModalAssignedToTrainerText)
			}
		}

		return ResponseSuccess(res, {
			Message: MESSAGE.MAILEDMODALASSIGNEDTOTRAINERTEXT,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.ModalAssignToTrainerLinkNotification = ModalAssignToTrainerLinkNotification;

//Get Workbook By Id
const getWorkbookById = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			workbookId: Joi.number().integer().positive().min(1).required(),
		});

		const { error, value } = schema.validate({
			workbookId: parseInt(req.params.workbookId),
			clientId: parseInt(req.params.clientId),
		});

		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { workbookId, clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = parseInt(req.params.clientId);

		[err, workbook] = await to(
			Workbook.findOne({
				where: {
					id: workbookId,
					// ClientId: parseInt(req.params.clientId),
				},
				include: [
					{
						model: Worksheet,
						include: [
							{
								model: DiwoAsset,
								where: {
									forBrief: false,
								},
							},
						],
					},
					{
						model: Course,
					},
					{
						model: DiwoModule,
					},
				],
				order: [
					[
						{
							model: Worksheet,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let _workbook = workbook.convertToJSON();

		// Workbook Assets
		[err, diwoAsset] = await to(
			DiwoAsset.findAll({
				where: {
					WorksheetId: {
						[Op.eq]: null,
					},
					QuestionId: {
						[Op.eq]: null,
					},
					WorkbookId: workbookId,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (diwoAsset && diwoAsset.length > 0) {
			_workbook.DiwoAssets = diwoAsset;
		} else {
			_workbook.DiwoAssets = [];
		}
		for (let worksheet of _workbook.Worksheets) {
			[err, briefFile] = await to(
				DiwoAsset.findAll({
					where: {
						WorksheetId: worksheet.id,
						forBrief: true,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			[err, questions] = await to(
				Question.findAll({
					where: {
						WorksheetId: worksheet.id,
					},
					include: [
						{
							model: DiwoAsset,
						},
						{
							model: Option,
						},
					],
					order: [
						[
							{
								model: Option,
							},
							'id',
							'ASC',
						],
						['id', 'ASC'],
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// Survey Question Groups
			[err, SurveyQueGroups] = await to(
				SurveyQueGroup.findAll({
					where: {
						WorksheetId: worksheet.id,
						WorkbookId: workbookId,
					},
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			// Survey DiwoSpinWheelCat
			[err, DiwoSpinWheelCatData] = await to(
				DiwoSpinWheelCat.findAll({
					where: {
						WorksheetId: worksheet.id,
						WorkbookId: workbookId,
					},
					order: [['id', 'ASC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			worksheet.briefFiles = briefFile;
			worksheet.Questions = questions;
			worksheet.questionGroups = SurveyQueGroups;
			worksheet.spinWheelQueCategory = DiwoSpinWheelCatData;
		}

		return ResponseSuccess(res, {
			data: _workbook,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWorkbookById = getWorkbookById;

const getAllWorkbookByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
		});
		const { error, value } = schema.validate({
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page } = value;

		// let clientId = req.params.clientId;
		let RoleId = req.user.RoleId;
		let userId = req.user.id;
		let finalData = [];
		let count = 0;

		let allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDiwo(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);
		let workbookList;

		if (RoleId == 11) {
			[err, workbookTrainerList] = await to(
				WorkbookTrainerMapping.findAndCountAll({
					where: {
						UserId: userId,
					},
					include: [
						{
							model: Workbook,
							where: {
								ClientId: allSubClientIds,
							},
						},
					],
					order: [[{ model: Workbook }, 'id', 'DESC']],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let workbookTrainerIds = [];
			if (workbookTrainerList && workbookTrainerList.rows && workbookTrainerList.rows.length > 0) {
				for (let workbook of workbookTrainerList.rows) {
					workbookTrainerIds.push(workbook.Workbook.id);
				}
			}

			count = workbookTrainerList.count;

			[err, workbookList] = await to(
				Workbook.findAll({
					where: {
						id: workbookTrainerIds,
						default: true,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
								},
							],
						},
						{
							model: Course,
						},
						{
							model: User_group,
							through: 'WorkbookUserGroupMapping',
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],

					order: [['id', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (workbookList && workbookList.length > 0) {
				for (let workbook of workbookList) {
					let updatedWorkbook = workbook.convertToJSON();
					[err, localUser] = await to(
						dbInstance[workbook.User.Market.db_name].User_master.findOne({
							where: {
								id: workbook.User.local_user_id,
							},
							attributes: ['first', 'last'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					updatedWorkbook.author = localUser.first + ' ' + localUser.last;
					let courseList = [];
					for (let course of workbook.Courses) {
						courseList.push(course.title);
					}
					updatedWorkbook.coursesName = courseList.toString();
					if (workbook?.DiwoModule?.type) {
						updatedWorkbook.moduleType = workbook.DiwoModule.type;
					}
					//Get Trainer
					[err, getTrainer] = await to(
						WorkbookTrainerMapping.findAll({
							where: {
								WorkbookId: workbook.id,
							},
							include: [
								{
									model: User,
									include: [
										{
											model: Market,
											attributes: ['db_name'],
										},
									],
									attributes: ['id', 'local_user_id'],
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);
					let trainers = [];
					if (getTrainer && getTrainer.length > 0) {
						for (let trainer of getTrainer) {
							[err, localUser] = await to(
								dbInstance[trainer.User.Market.db_name].User_master.findOne({
									where: {
										id: trainer.User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							trainers.push({
								id: trainer.User.id,
								name: localUser.first + ' ' + localUser.last,
							});
						}
					}
					updatedWorkbook.trainerList = trainers;
					delete updatedWorkbook.Courses;
					delete updatedWorkbook.DiwoModule;
					delete updatedWorkbook.User;
					finalData.push(updatedWorkbook);
				}
			}
		} else {
			[err, workbookList] = await to(
				Workbook.findAndCountAll({
					distinct: true,
					where: {
						ClientId: allSubClientIds,
						default: true,
					},
					include: [
						{
							model: User,
							include: [
								{
									model: Market,
								},
							],
						},
						{
							model: Course,
						},
						{
							model: User_group,
							through: 'WorkbookUserGroupMapping',
						},
						{
							model: DiwoModule,
							attributes: ['type'],
						},
					],
					order: [['id', 'DESC']],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			count = workbookList.count;

			for (let workbook of workbookList.rows) {
				let updatedWorkbook = workbook.convertToJSON();
				[err, localUser] = await to(
					dbInstance[workbook.User.Market.db_name].User_master.findOne({
						where: {
							id: workbook.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				updatedWorkbook.author = localUser.first + ' ' + localUser.last;

				let courseList = [];
				for (let course of workbook.Courses) {
					courseList.push(course.title);
				}
				updatedWorkbook.coursesName = courseList.toString();

				if (workbook?.DiwoModule?.type) {
					updatedWorkbook.moduleType = workbook.DiwoModule.type;
				}

				//Get Trainer
				[err, getTrainer] = await to(
					WorkbookTrainerMapping.findAll({
						where: {
							WorkbookId: workbook.id,
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
								attributes: ['id', 'local_user_id'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let trainers = [];
				if (getTrainer && getTrainer.length > 0) {
					for (let trainer of getTrainer) {
						[err, localUser] = await to(
							dbInstance[trainer.User.Market.db_name].User_master.findOne({
								where: {
									id: trainer.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						trainers.push({
							id: trainer.User.id,
							name: localUser.first + ' ' + localUser.last,
						});
					}
				}
				updatedWorkbook.trainerList = trainers;

				delete updatedWorkbook.Courses;
				delete updatedWorkbook.DiwoModule;
				delete updatedWorkbook.User;

				finalData.push(updatedWorkbook);
			}
		}

		return ResponseSuccess(res, {
			data: finalData,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllWorkbookByClientId = getAllWorkbookByClientId;

const getAllSubChildClientIds = async function (clientId) {
	try {
		let err, ClientsDetail;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClientIds = [];
		let childClientId = [];
		childClientId.push(parentClientId);
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}
			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					include: [
						{
							model: Client_job_role,
						},
					],
				})
			);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				let client = ClientsDetail[i];
				if (client.DiwoAccess) {
					finalArrayOfClientIds.push(client.id);
				}
			}
			if (childClientId.length <= 0) {
				flag = false;
			}
		}
		return finalArrayOfClientIds;
	} catch (error) {
		return [];
	}
};

const deleteWorkbookById = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			workbookIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
		});

		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			workbookIds: req.body,
		});

		if (error) {
			res.status(400).json({ error: error.details[0].message });
		}

		const { clientId, workbookIds } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let workbookIds = req.body;
		let userId = req.user.id;
		[err, workbook] = await to(
			Workbook.update(
				{
					isDeleted: true,
					status: 'Deleted',
				},
				{
					where: {
						id: workbookIds,
						ClientId: clientId,
					},
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, workbook] = await to(
			WorkbookTrainerMapping.destroy({
				where: {
					WorkbookId: workbookIds,
				},
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//For Notification
		[err, workbookDetails] = await to(
			Workbook.findAll({
				where: {
					id: workbookIds,
					ClientId: clientId,
				},
				attributes: ['title'],
			})
		);
		[err, getUser] = await to(
			User.findOne({
				where: {
					id: userId,
				},
				include: [
					{
						model: Market,
						attributes: ['db_name'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		[err, localUser] = await to(
			dbInstance[getUser.Market.db_name].User_master.findOne({
				where: {
					id: getUser.local_user_id,
				},
				attributes: ['first', 'last'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let userName = `${localUser && localUser.first ? localUser.first : ''} ${
			localUser && localUser.last ? localUser.last : ''
		}`;

		for (let workbook of workbookDetails) {
			let notifcationMessage = MESSAGE.WORKBOOK_DELETE_NOTIFICATION;
			notifcationMessage = notifcationMessage.replace('{{workbook_name}}', workbook.title);
			notifcationMessage = notifcationMessage.replace('{{user_name}}', userName);
			let userIds = await getAllDiwoUserIdsForNotification(parseInt(req.params.clientId));
			const index = userIds.indexOf(req.user.id);
			if (index !== -1) {
				userIds.splice(index, 1);
			}
			await createNotificationforDiwo(notifcationMessage, ['Bell'], userIds);
			let notifcationMessageForUser = MESSAGE.WORKBOOK_DELETE_NOTIFICATION;
			notifcationMessageForUser = notifcationMessageForUser.replace('{{workbook_name}}', workbook.title);
			notifcationMessageForUser = notifcationMessageForUser.replace('{{user_name}}', 'You');
			await createNotificationforDiwo(notifcationMessageForUser, ['Bell'], [req.user.id]);
		}

		[err, newLog] = await to(
			createlog(
				req.user.id,
				req.user.ClientId,
				req.user.RoleId,
				`Delete Workbook`,
				req.ip,
				req.useragent,
				req.user.type,
				{
					WorkbookId: workbookIds,
				}
			)
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			message: MESSAGE.WORKBOOK_DELETED,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.deleteWorkbookById = deleteWorkbookById;

const getTrainerListByClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let err, ClientsDetail;
		let parentClientId = clientId;
		let flag = true;
		let finalArrayOfClient = [];
		let childClientId = [];
		finalArrayOfClient.push(clientId);
		childClientId.push(parentClientId);
		let totalClientCount;
		let count = 0;

		[err, totalClientCount] = await to(Client.count());

		while (flag) {
			count++;
			if (count > totalClientCount) {
				flag = false;
				break;
			}

			[err, ClientsDetail] = await to(
				Client.findAll({
					where: {
						is_deleted: false,
						Associate_client_id: childClientId,
					},
					attributes: ['id', 'Associate_client_id', 'DiwoAccess'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			childClientId = [];

			if (ClientsDetail && ClientsDetail.length <= 0) {
				flag = false;
			}

			for (let i in ClientsDetail) {
				childClientId.push(ClientsDetail[i].id);
				if (ClientsDetail[i].DiwoAccess) {
					finalArrayOfClient.push(ClientsDetail[i].id);
				}
			}

			if (childClientId.length <= 0) {
				flag = false;
			}
		}

		[err, trainers] = await to(
			User_role_client_mapping.findAll({
				where: {
					ClientId: finalArrayOfClient,
				},
				include: [
					{
						model: Role,
						where: {
							id: 11,
							diwoRole: true,
						},
					},
					{
						model: User,
						include: [
							{
								model: Market,
							},
						],
						where: {
							is_deleted: false,
							forDiwo: true,
						},
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let trainerList = [];
		if (trainers && trainers.length > 0) {
			for (let trainer of trainers) {
				[err, localUser] = await to(
					dbInstance[trainer.User.Market.db_name].User_master.findOne({
						where: {
							id: trainer.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				trainerList.push({
					id: trainer.User.id,
					name: localUser.first + ' ' + localUser.last,
				});
			}
		}
		return ResponseSuccess(res, {
			data: trainerList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getTrainerListByClientId = getTrainerListByClientId;

const getWorkbookListbyTrainer = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		let userId = req.user.id;
		// let clientId = req.params.clientId;
		// let userRole = req.params.userRole;

		let allChildClientList = [];
		allChildClientList = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDiwo(clientId);
		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allChildClientList.push(...allSubClientIds2);
		}
		allChildClientList.push(clientId);

		[err, workbookList] = await to(
			WorkbookTrainerMapping.findAll({
				where: {
					UserId: userId,
				},
				include: [
					{
						model: Workbook,
						attributes: ['id', 'title', 'DiwoModuleId'],
						where: {
							status: 'Published',
							isDeleted: false,
							ClientId: allChildClientList,
							DiwoModuleId: 1,
							default: true,
						},
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let list = [];
		if (workbookList && workbookList.length > 0) {
			for (let workbook of workbookList) {
				list.push(workbook.Workbook);
			}
		}
		return ResponseSuccess(res, {
			data: list,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWorkbookListbyTrainer = getWorkbookListbyTrainer;

const getWorkbookListbyCourseId = async function (req, res) {
	try {
		const schema = Joi.object({
			courseId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			courseId: parseInt(req.params.courseId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { courseId } = value;

		let userId = req.user.id;
		// let courseId = req.params.courseId;
		[err, WorkbookList] = await to(
			Course_workbook_mapping.findAll({
				where: {
					CourseId: courseId,
				},
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		let list = [];
		if (WorkbookList && WorkbookList.length > 0) {
			for (let Workbook of WorkbookList) {
				list.push(Workbook.WorkbookId);
			}
		}
		[err, WorkbookList2] = await to(
			WorkbookTrainerMapping.findAll({
				where: {
					WorkbookId: list,
					UserId: userId,
				},
				include: [
					{
						model: Workbook,
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: WorkbookList2,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWorkbookListbyCourseId = getWorkbookListbyCourseId;

const getAllSearchWorkbookbyClientId = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().positive().required(),
			limit: Joi.number()
				.integer()
				.min(validationConstant.limit.min)
				.max(validationConstant.limit.max)
				.default(validationConstant.limit.default),
			page: Joi.number()
				.integer()
				.min(validationConstant.page.min)
				.max(validationConstant.page.max)
				.default(validationConstant.page.default),
			selectedDate: Joi.alternatives()
				.try(
					Joi.object({
						startDate: Joi.date().required(),
						endDate: Joi.date().allow(null),
					}),
					Joi.allow(null) // Allows selectedDate to be explicitly null
				)
				.optional(),
		});
		const { error, value } = schema.validate({
			clientId: req.user.ClientId,
			limit: req.query.limit,
			page: req.query.page,
			selectedDate: req.body.selectedDate,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, limit, page, selectedDate } = value;

		let searchKey = req.body.searchKey.split(' ');
		// let clientId = req.params.clientId;
		let RoleId = req.user.RoleId;
		let count = 0;

		let allSubClientIds = [];

		allSubClientIds = await getAllSubChildClientIds(clientId);
		let allSubClientIds2 = await getAllSubChildClientIdsForDiwo(clientId);

		if (allSubClientIds2 && allSubClientIds2.length > 0) {
			allSubClientIds.push(...allSubClientIds2);
		}
		allSubClientIds.push(clientId);

		let finalData = [];
		let userId = req.user.id;
		let UserDetailId = [];
		let moduleId = [];
		let filterColumn = req.body.filterColumn;
		filterColumn = req.body.filterColumn.map((item) => {
			return item.value;
		});
		let whereConditionForWorkbookColumn = [];
		let whereConditionForCourseColumn = [];
		let whereConditionForModuleColumn = [];
		let UserDetail;
		// let selectedDate = req.body.selectedDate;
		let dateCondition = [];
		let offset = (page - 1) * limit;
		// let limit = parseInt(req.query.limit);
		// let page = parseInt(req.query.page);

		dateCondition.push({
			updatedAt: {
				[Op.ne]: null,
			},
		});

		if (selectedDate.startDate != null && selectedDate.endDate != null) {
			dateCondition.push({
				updatedAt: {
					[Op.between]: [selectedDate.startDate, selectedDate.endDate],
				},
			});
		}

		//for course
		if (filterColumn.indexOf('courseName') > -1) {
			whereConditionForCourseColumn.push({
				ClientId: allSubClientIds,
				title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		//for workbook
		if (filterColumn.indexOf('title') > -1) {
			whereConditionForWorkbookColumn.push({
				ClientId: allSubClientIds,
				title: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		if (filterColumn.indexOf('include_certification') > -1) {
			let key = typeof req.body.searchKey === 'string' ? req.body.searchKey.toLowerCase() : '';
			let text = 'include certification';

			if (text.includes(key)) {
				whereConditionForWorkbookColumn.push({
					haveCertificate: true,
				});
			}
		}

		//for module type
		if (filterColumn.indexOf('moduletype') > -1) {
			[err, moduleList] = await to(
				DiwoModule.findAll({
					where: {
						type: {
							[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
						},
					},
					order: [['id', 'ASC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (moduleList && moduleList.length > 0) {
				for (let module_ of moduleList) {
					moduleId.push(module_.id);
				}
			}
		}

		if (!isNaN(searchKey)) {
			if (filterColumn.indexOf('moduleId') > -1) {
				let searchKeys = parseInt(req.body.searchKey);
				whereConditionForWorkbookColumn.push({
					id: {
						[sequelize.Op.eq]: searchKeys,
					},
				});
			}
		}

		if (filterColumn.indexOf('status') > -1) {
			whereConditionForWorkbookColumn.push({
				status: {
					[sequelize.Op.iLike]: '%' + req.body.searchKey + '%',
				},
			});
		}

		[err, MarketDetails] = await to(
			Market.findAll({
				where: {
					status: true,
				},
			})
		);

		if (err) return ResponseError(res, err, 500, true);
		if (filterColumn.indexOf('first') > -1) {
			if (MarketDetails && MarketDetails.length > 0) {
				for (let market of MarketDetails) {
					let marketUser = market.convertToJSON();
					[err, localUser] = await to(
						dbInstance[marketUser.db_name].User_master.findAll({
							where: {
								[sequelize.Op.or]: {
									first: {
										[sequelize.Op.iLike]: searchKey[0] + '%',
									},
									last: {
										[sequelize.Op.iLike]: searchKey[1] + '%',
									},
								},
							},
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					let LocalUserId = [];
					if (localUser && localUser.length > 0) {
						for (let User of localUser) {
							LocalUserId.push(User.id);
						}
					}

					[err, UserDetail] = await to(
						User.findAll({
							where: {
								local_user_id: LocalUserId,
								MarketId: market.id,
								forDiwo: true,
							},
							attributes: ['id'],
						})
					);

					if (UserDetail && UserDetail.length > 0) {
						for (let User of UserDetail) {
							UserDetailId.push(User.id);
						}
					}
					if (err) return ResponseError(res, err, 500, true);
				}
			}
			if (err) return ResponseError(res, err, 500, true);
		}

		[err, courseList1] = await to(
			Course.findAll({
				where: {
					ClientId: allSubClientIds,
					[sequelize.Op.or]: whereConditionForCourseColumn,
				},
				include: [
					{
						model: Workbook,
						through: 'Course_workbook_mapping',
					},
				],
				order: [['createdAt', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let workbookId = [];
		if (courseList1 && courseList1.length > 0) {
			for (let course of courseList1) {
				for (let workbook of course.Workbooks) {
					workbookId.push(workbook.id);
				}
			}
		}

		[err, workbookList] = await to(
			Workbook.findAll({
				where: {
					ClientId: allSubClientIds,
					[sequelize.Op.or]: whereConditionForWorkbookColumn,
				},
				order: [['createdAt', 'DESC']],
				attributes: ['id'],
			})
		);

		if (workbookList && workbookList.length > 0) {
			for (let workbook of workbookList) {
				workbookId.push(workbook.id);
			}
		}

		if (err) return ResponseError(res, err, 500, true);

		if (RoleId == 11) {
			[err, workbookTrainerList] = await to(
				WorkbookTrainerMapping.findAndCountAll({
					where: {
						UserId: userId,
					},
					include: [
						{
							model: Workbook,
							where: {
								id: workbookId,
								default: true,
							},
						},
					],
					order: [[{ model: Workbook }, 'id', 'DESC']],
					offset: offset,
					limit: limit,
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			let workbookTrainerIds = [];
			if (workbookTrainerList && workbookTrainerList.rows && workbookTrainerList.rows.length > 0) {
				for (let workbook of workbookTrainerList.rows) {
					workbookTrainerIds.push(workbook.Workbook.id);
				}
			}

			count = workbookTrainerList.count;

			[err, workbookData] = await to(
				Workbook.findAll({
					distinct: true,
					where: {
						[sequelize.Op.or]: [
							{
								id: workbookId,
							},
							{
								UserId: UserDetailId,
							},
							{
								DiwoModuleId: moduleId,
							},
						],
						[Op.and]: dateCondition,
						ClientId: allSubClientIds,
						default: true,
					},
					include: [
						{
							model: Course,
						},
						{
							model: User,
							include: [
								{
									model: Market,
								},
							],
						},
						{
							model: User_group,
							through: 'WorkbookUserGroupMapping',
						},
						{
							model: DiwoModule,
						},
					],
					order: [['id', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (workbookData && workbookData.length > 0) {
				for (let workbook of workbookData) {
					let updatedWorkbook = workbook.convertToJSON();

					[err, localUser] = await to(
						dbInstance[workbook.User.Market.db_name].User_master.findOne({
							where: {
								id: workbook.User.local_user_id,
							},
							attributes: ['first', 'last'],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					if (updatedWorkbook) {
						updatedWorkbook.author = localUser.first + ' ' + localUser.last;
					}

					let courseList = [];
					for (let course of workbook.Courses) {
						courseList.push(course.title);
					}

					if (updatedWorkbook) {
						updatedWorkbook.coursesName = courseList.toString();
					}

					if (workbook?.DiwoModule?.type) {
						updatedWorkbook.moduleType = workbook.DiwoModule.type;
					}

					//Get Trainer
					[err, getTrainer] = await to(
						WorkbookTrainerMapping.findAll({
							where: {
								WorkbookId: workbook.id,
							},
							include: [
								{
									model: User,
									include: [
										{
											model: Market,
											attributes: ['db_name'],
										},
									],
									attributes: ['id', 'local_user_id'],
								},
							],
						})
					);
					if (err) return ResponseError(res, err, 500, true);

					let trainers = [];
					if (getTrainer && getTrainer.length > 0) {
						for (let trainer of getTrainer) {
							[err, localUser] = await to(
								dbInstance[trainer.User.Market.db_name].User_master.findOne({
									where: {
										id: trainer.User.local_user_id,
									},
									attributes: ['first', 'last'],
								})
							);
							if (err) return ResponseError(res, err, 500, true);
							trainers.push({
								id: trainer.User.id,
								name: localUser.first + ' ' + localUser.last,
							});
						}
					}
					updatedWorkbook.trainerList = trainers;

					delete updatedWorkbook.Courses;
					delete updatedWorkbook.DiwoModule;
					delete updatedWorkbook.User;

					finalData.push(updatedWorkbook);
				}
			}
		} else {
			[err, workbookData] = await to(
				Workbook.findAndCountAll({
					distinct: true,
					where: {
						[sequelize.Op.or]: [
							{
								id: workbookId,
							},
							{
								UserId: UserDetailId,
							},
							{
								DiwoModuleId: moduleId,
							},
						],
						[Op.and]: dateCondition,
						ClientId: allSubClientIds,
						default: true,
					},
					include: [
						{
							model: Course,
						},
						{
							model: User,
							include: [
								{
									model: Market,
								},
							],
						},
						{
							model: User_group,
							through: 'WorkbookUserGroupMapping',
						},
						{
							model: DiwoModule,
						},
					],
					offset: offset,
					limit: limit,
					order: [['createdAt', 'DESC']],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			count = workbookData.count;

			for (let workbook of workbookData.rows) {
				let updatedWorkbook = workbook.convertToJSON();

				[err, localUser] = await to(
					dbInstance[workbook.User.Market.db_name].User_master.findOne({
						where: {
							id: workbook.User.local_user_id,
						},
						attributes: ['first', 'last'],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				if (updatedWorkbook) {
					updatedWorkbook.author = localUser.first + ' ' + localUser.last;
				}

				let courseList = [];
				for (let course of workbook.Courses) {
					courseList.push(course.title);
				}

				if (updatedWorkbook) {
					updatedWorkbook.coursesName = courseList.toString();
				}

				if (workbook?.DiwoModule?.type) {
					updatedWorkbook.moduleType = workbook.DiwoModule.type;
				}

				//Get Trainer
				[err, getTrainer] = await to(
					WorkbookTrainerMapping.findAll({
						where: {
							WorkbookId: workbook.id,
						},
						include: [
							{
								model: User,
								include: [
									{
										model: Market,
										attributes: ['db_name'],
									},
								],
								attributes: ['id', 'local_user_id'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);

				let trainers = [];
				if (getTrainer && getTrainer.length > 0) {
					for (let trainer of getTrainer) {
						[err, localUser] = await to(
							dbInstance[trainer.User.Market.db_name].User_master.findOne({
								where: {
									id: trainer.User.local_user_id,
								},
								attributes: ['first', 'last'],
							})
						);
						if (err) return ResponseError(res, err, 500, true);
						trainers.push({
							id: trainer.User.id,
							name: localUser.first + ' ' + localUser.last,
						});
					}
				}
				updatedWorkbook.trainerList = trainers;

				delete updatedWorkbook.Courses;
				delete updatedWorkbook.DiwoModule;
				delete updatedWorkbook.User;

				finalData.push(updatedWorkbook);
			}
		}

		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: finalData,
			count: count,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllSearchWorkbookbyClientId = getAllSearchWorkbookbyClientId;

// const createCourse = async function (req, res) {
// 	try {
// 		const schema = Joi.object({
// 			clientId: Joi.number().integer().min(1).positive().required(),
// 		});
// 		const { error, value } = schema.validate({
// 			clientId: parseInt(req.params.clientId),
// 		});
// 		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

// 		const { clientId } = value;

// 		//Check Client Access
// 		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
// 			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
// 		}

// 		// let clientId = req.params.clientId;
// 		let payload = req.body;
// 		payload.ClientId = clientId;
// 		[err, createCourse_] = await to(Course.create(payload));
// 		if (err) return ResponseError(res, err, 500, true);

// 		[err, newLog] = await to(
// 			createlog(
// 				req.user.id,
// 				req.user.ClientId,
// 				req.user.RoleId,
// 				`Create Course`,
// 				req.ip,
// 				req.useragent,
// 				req.user.type,
// 				{
// 					CourseId: createCourse_.id,
// 				}
// 			)
// 		);
// 		if (err) return ResponseError(res, err, 500, true);

// 		return ResponseSuccess(res, {
// 			data: createCourse_,
// 		});
// 	} catch (error) {
// 		return ResponseError(res, error, 500, true);
// 	}
// };
// module.exports.createCourse = createCourse;

const compressImage = async function (payload) {
	try {
		console.log('-------compressImage-Function Call---------');
		setTimeout(async () => {
			console.log('--##########################-----compressImage-Start---############################');

			for (let data of payload) {
				// Compress the image before saving
				await sharp(data.image)
					.png({ quality: 70 }) // Adjust the quality (0-100, lower means more compression)
					.toBuffer()
					.then((compressedBuffer) => {
						fs.writeFileSync(data.outputPath, compressedBuffer);
					})
					.catch((err) => {
						console.error('Error compressing image:', err);
					});
			}
			console.log('--##########################----compressImage-end------##############-');
		}, 10000);
	} catch (error) {
		console.log('-------Error when Compress Image----', error);
	}
};

const convertPdfToImages = async function (req, res) {
	try {
		let convertedImages = [];
		if (req.body.files) {
			req.files = req.body.files;
			delete req.body.files;
		}

		if (req.files && req.files.PDF && req.files.PDF.length > 0) {
			const pdfPath = `${CONFIG.imagePath}/uploads/diwo_assets/${req.files.PDF[0].filename}`;
			const outputImages = await pdf2img.convert(pdfPath);
			let payloadForCompression = [];
			for (i = 0; i < outputImages.length; i++) {
				let fileName = `${shortid.generate()}__${Date.now()}_${i + 1}.jpg`;
				let outputPath = `${CONFIG.imagePath}/uploads/diwo_assets/${fileName}`;

				fs.writeFile(`${CONFIG.imagePath}/uploads/diwo_assets/${fileName}`, outputImages[i], function (error) {
					if (error) {
						console.error('Error: ' + error);
					}
				});

				payloadForCompression.push({ image: outputImages[i], outputPath: outputPath });

				convertedImages.push({
					path: `uploads/diwo_assets/${fileName}`,
					fileName: fileName,
				});
			}

			compressImage(payloadForCompression);
		}
		return ResponseSuccess(res, {
			data: convertedImages,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.convertPdfToImages = convertPdfToImages;

const checkDatailsPresentOrNot = async function (data) {
	try {
		let flag = false;
		for (let key in data) {
			if (data[key] != '') {
				flag = true;
			}
		}
		return flag;
	} catch (error) {}
};
const checkDataIsValidOrNot = async function (data) {
	try {
		if (
			data === null ||
			data === undefined ||
			data === '' ||
			data === 'null' ||
			data === 'undefined' ||
			(typeof data === 'string' && data.trim() === '')
		) {
			return false;
		}
		return true;
	} catch (error) {
		return false;
	}
};

//Read Uploaded drip List Excel Sheet
const uploadBulkWorksheets = async function (req, res) {
	let filename = CONFIG.imagePath + 'uploads/excel/' + req.file.filename;
	let moduleType = parseInt(req.params.moduleType);
	exceltojson = xlsxtojson;

	console.log('-moduleType-', moduleType);

	try {
		let lerningFlag = false;
		let discussionFlag = false;
		let quizFlag = false;
		let pollFlag = false;
		let wordCloudFlag = false;
		let surveyFlag = false;
		let offlineTaskFlag = false;
		let spinTheWheelFlag = false;

		worksheetList = [];
		finalList = [];
		contentList = [];
		discussionList = [];
		quizList = [];
		pollList = [];
		wordCloudList = [];
		surveyList = [];
		offlineList = [];
		spinTheWheelList = [];

		const options = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Learning Content',
		};

		const options1 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Discussion',
		};

		const options2 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Quiz',
		};

		const options3 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Poll',
		};

		const options4 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Word Cloud',
		};

		const options5 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Survey',
		};

		const options6 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Offline Task',
		};

		const options7 = {
			input: filename,
			output: null,
			lowerCaseHeaders: true,
			sheet: 'Spin The Wheel',
		};

		// console.log('-options-', options);
		// console.log('-options2-', options2);
		// console.log('-options3-', options3);
		// console.log('-options4-', options4);
		// console.log('-options5-', options5);
		// console.log('-options6-', options6);

		//Worksheet Learning Content
		exceltojson(options, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					contentList = await LearningContentExcel(rows, req, res);
					if (contentList) {
						lerningFlag = true;
					}
				}
			} else {
				lerningFlag = true;
			}
			return;
		});

		//Worksheet Learning Content
		exceltojson(options1, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					discussionList = await DiscussionExcel(rows, req, res);
					if (discussionList) {
						discussionFlag = true;
					}
				}
			} else {
				discussionFlag = true;
			}
			return;
		});

		//Worksheet Quiz
		exceltojson(options2, async function (err, rows) {
			if (err) {
				return;
			}

			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					quizList = await QuizExcel(rows, req, res, moduleType);
					if (quizList) {
						quizFlag = true;
					}
				}
			} else {
				quizFlag = true;
			}
			return;
		});

		//Worksheet Poll
		exceltojson(options3, async function (err, rows) {
			if (err) {
				return;
			}

			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					pollList = await PollExcel(rows, req, res);
					if (pollList) {
						pollFlag = true;
					}
				}
			} else {
				pollFlag = true;
			}
			return;
		});

		//Worksheet Word CLoud
		exceltojson(options4, async function (err, rows) {
			if (err) {
				return;
			}
			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					wordCloudList = await WordCloudExcel(rows, req, res);
					if (wordCloudList) {
						wordCloudFlag = true;
					}
				}
			} else {
				wordCloudFlag = true;
			}
			return;
		});

		//Worksheet Survey
		exceltojson(options5, async function (err, rows) {
			if (err) {
				return;
			}

			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					surveyList = await SurveyExcel(rows, req, res);
					if (surveyList) {
						surveyFlag = true;
					}
				}
			} else {
				surveyFlag = true;
			}
			return;
		});

		//Worksheet Offline Task
		exceltojson(options6, async function (err, rows) {
			if (err) {
				return;
			}

			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					offlineList = await offlineTaskExcel(rows, req, res);
					if (offlineList) {
						offlineTaskFlag = true;
					}
				}
			} else {
				offlineTaskFlag = true;
			}
			return;
		});

		//Worksheet Spin The Wheel
		exceltojson(options7, async function (err, rows) {
			if (err) {
				return;
			}

			if (rows && rows.length > 0) {
				let flag = false;
				for (let key in rows[0]) {
					if (rows[0][key] != '') {
						flag = true;
					}
				}
				if (flag) {
					spinTheWheelList = await SpinTheWheelExcel(rows, req, res);
					if (spinTheWheelList) {
						spinTheWheelFlag = true;
					}
				}
			} else {
				spinTheWheelFlag = true;
			}
			return;
		});

		let counter = 0;
		const intervalId = setInterval(async () => {
			counter++;

			if (
				lerningFlag &&
				discussionFlag &&
				quizFlag &&
				pollFlag &&
				moduleType == 1 &&
				wordCloudFlag &&
				surveyFlag &&
				offlineTaskFlag &&
				spinTheWheelFlag
			) {
				console.log('----1---');

				let payload = {
					LcontentList: contentList,
					discussionList: discussionList,
					quizList: quizList,
					pollList: pollList,
					wordCloudList: wordCloudList,
					surveyList: surveyList,
					offlineList: offlineList,
					spinTheWheelList: spinTheWheelList,
				};
				clearInterval(intervalId);
				return ResponseSuccess(res, {
					data: payload,
				});
			} else if (
				lerningFlag &&
				quizFlag &&
				pollFlag &&
				moduleType != 1 &&
				surveyFlag &&
				offlineTaskFlag &&
				spinTheWheelFlag
			) {
				console.log('----2---');
				let payload = {
					LcontentList: contentList,
					discussionList: [],
					quizList: quizList,
					pollList: pollList,
					wordCloudList: [],
					surveyList: surveyList,
					offlineList: offlineList,
					spinTheWheelList: spinTheWheelList,
				};
				clearInterval(intervalId);
				return ResponseSuccess(res, {
					data: payload,
				});
			} else if (counter === 100) {
				clearInterval(intervalId);
			}
		}, 500);
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.uploadBulkWorksheets = uploadBulkWorksheets;

const LearningContentExcel = async function (data, req, res) {
	try {
		console.log('---------Learning Content call---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type: 'Learning Content',
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}
				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetList.push(worksheetDetail);
			}

			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const DiscussionExcel = async function (data, req, res) {
	try {
		console.log('---------Discussion call---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type: 'Discussion',
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}
				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetList.push(worksheetDetail);
			}

			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const QuizExcel = async function (data, req, res, moduleType) {
	try {
		console.log('---------quizCall---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
			'*worksheet template (quiz/quiz (randomised))',
			'allow only one attempt (yes/no)',
			'publish leaderboard to learners (yes/no)',
			'show correct answer and score (yes/no)',
			'time to show (upon submission/upon session closure)',
			'number of random questions for each learner',
			'*question no.',
			'*question type(mcq/drag & drop)',
			'*questions text',
			'*question score',
			'*option no.',
			'*options text',
			'answer key(yes/no)',
		];

		const updatedHeaders = await updateExcelHeadersByType(excelHearders, moduleType);

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of updatedHeaders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type:
						moduleType != 1
							? rows[i]['*lesson template (quiz/quiz (randomised))']
							: rows[i]['*worksheet template (quiz/quiz (randomised))'],
					isGraded: rows[i]['allow only one attempt (yes/no)'],
					isAssessment: rows[i]['add to assessment (yes/no)'],
					publishResult: rows[i]['publish leaderboard to learners (yes/no)'],
					isShowScore: rows[i]['show correct answer and score (yes/no)'],
					timeToShowOption: rows[i]['time to show (upon submission/upon session closure)'],
					quizRandCount: rows[i]['number of random questions for each learner'],
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				// Check Worksheet Template Type
				if ((await checkDataIsValidOrNot(worksheetDetail.type)) == false) {
					worksheetDetail.errorMsg.push('Worksheet Template is required.');
					worksheetDetail.isError = true;
				} else {
					//Check Valid Worksheet Template Type
					let templateTypes = ['Quiz', 'Quiz (Randomised)'];
					let flag = false;
					for (let type of templateTypes) {
						if (type.toLowerCase() == worksheetDetail.type.toLowerCase()) {
							flag = true;
							worksheetDetail.type = type;
							break;
						}
					}

					if (!flag) {
						if (moduleType != 1) {
							worksheetDetail.errorMsg.push('Lesson Template is invalid.');
						} else {
							worksheetDetail.errorMsg.push('Worksheet Template is invalid.');
						}
						worksheetDetail.isError = true;
					}
				}

				//check Quiz Graded or not
				worksheetDetail.isGraded = worksheetDetail.isGraded ? worksheetDetail.isGraded.toLowerCase() : '';
				if (
					worksheetDetail.isGraded == '' ||
					worksheetDetail.isGraded == 'no' ||
					worksheetDetail.isGraded == 'false' ||
					worksheetDetail.isGraded == false
				) {
					worksheetDetail.isGraded = false;
				} else {
					worksheetDetail.isGraded = true;
				}

				//check quiz assesment
				worksheetDetail.isAssessment = worksheetDetail.isAssessment ? worksheetDetail.isAssessment.toLowerCase() : '';
				if (
					worksheetDetail.isAssessment == '' ||
					worksheetDetail.isAssessment == 'no' ||
					worksheetDetail.isAssessment == 'false' ||
					worksheetDetail.isAssessment == false
				) {
					worksheetDetail.isAssessment = false;
				} else {
					worksheetDetail.isAssessment = true;
				}

				//check Publish Result
				worksheetDetail.publishResult = worksheetDetail.publishResult
					? worksheetDetail.publishResult.toLowerCase()
					: '';
				if (
					worksheetDetail.publishResult == '' ||
					worksheetDetail.publishResult == 'no' ||
					worksheetDetail.publishResult == 'false' ||
					worksheetDetail.publishResult == false
				) {
					worksheetDetail.publishResult = false;
				} else {
					worksheetDetail.publishResult = true;
				}

				// Check Quiz Show Correct Incorrect On PWA
				worksheetDetail.isShowScore = worksheetDetail.isShowScore ? worksheetDetail.isShowScore.toLowerCase() : '';
				if (
					worksheetDetail.isShowScore == '' ||
					worksheetDetail.isShowScore == 'no' ||
					worksheetDetail.isShowScore == 'false' ||
					worksheetDetail.isShowScore == false
				) {
					worksheetDetail.isShowScore = false;
				} else {
					worksheetDetail.isShowScore = true;
				}

				// Check Quiz Show Timing On PWA
				if (
					(worksheetDetail.type.toLowerCase() == 'quiz' || worksheetDetail.type.toLowerCase() == 'quiz (randomised)') &&
					worksheetDetail.isShowScore &&
					(await checkDataIsValidOrNot(worksheetDetail.timeToShowOption)) == false
				) {
					worksheetDetail.errorMsg.push('Timing To Show is required.');
					worksheetDetail.isError = true;
				} else {
					//Check Valid Show  Type
					let resultTypes = ['Upon Submission', 'Upon Session Closure'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == worksheetDetail.timeToShowOption.toLowerCase()) {
							flag = true;
							worksheetDetail.timeToShowOption = type;
							break;
						}
					}
				}

				if (worksheetDetail.type == 'Quiz (Randomised)') {
					if (await checkDataIsValidOrNot(worksheetDetail.quizRandCount)) {
						if (parseInt(worksheetDetail.quizRandCount) == NaN) {
							worksheetDetail.errorMsg.push('Random question number must be in numerical form.');
							worksheetDetail.isError = true;
						} else {
							worksheetDetail.quizRandCount = parseInt(worksheetDetail.quizRandCount);
						}
					} else {
						worksheetDetail.errorMsg.push('Random question number is required.');
						worksheetDetail.isError = true;
					}
				}

				//Code Quiz Question and Options
				if (worksheetDetail.type.toLowerCase() == 'quiz' || worksheetDetail.type.toLowerCase() == 'quiz (randomised)') {
					console.log('----------quizINter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;

					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							//Question Validation
							if (
								rows[j]['*question no.'] ||
								rows[j]['*question type(mcq/drag & drop)'] ||
								rows[j]['*questions text'] ||
								rows[j]['*question score']
							) {
								if (rows[j]['*question no.'] == '' || rows[j]['*question no.'] == null) {
									worksheetDetail.errorMsg.push('Question No. is required.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question no.']) == NaN) {
									worksheetDetail.errorMsg.push('Question No. is invalid.');
									worksheetDetail.isError = true;
								}

								if (
									rows[j]['*question type(mcq/drag & drop)'] == '' &&
									(worksheetDetail.type == 'Quiz' || worksheetDetail.type == 'Quiz (Randomised)')
								) {
									worksheetDetail.errorMsg.push('Question Type is required.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*questions text'] == '') {
									worksheetDetail.errorMsg.push('questions text is required.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*question score'] == '' || rows[j]['*question score'] == null) {
									worksheetDetail.errorMsg.push('Question Score is required.');
									worksheetDetail.isError = true;
								} else if (isNaN(rows[j]['*question score'])) {
									worksheetDetail.errorMsg.push('Question score must be in numerical form.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question score']) <= 0) {
									worksheetDetail.errorMsg.push('Please add score greate than 0');
									worksheetDetail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											spinQueScore: question_spinQueScore,
										},
										Options: options,
									};

									worksheetDetail.Questions.push(payload);

									question_text = null;
									question_type = null;
									question_spinQueScore = 0;

									if (options.length < 2) {
										worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
										worksheetDetail.isError = true;
									}

									let questionType = '';
									if (rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'mcq') {
										questionType = 'MCQ';
									} else if (
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag and drop' ||
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag & drop'
									) {
										questionType = 'Drag and Drop';
									}

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									question_spinQueScore = rows[j]['*question score'];

									options = [];
								} else {
									let questionType = '';
									if (rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'mcq') {
										questionType = 'MCQ';
									} else if (
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag and drop' ||
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag & drop'
									) {
										questionType = 'Drag and Drop';
									}

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									question_spinQueScore = rows[j]['*question score'];
								}
							}

							//Option Validation
							if (
								worksheetDetail.type.toLowerCase() == 'quiz' ||
								worksheetDetail.type.toLowerCase() == 'quiz (randomised)'
							) {
								if (rows[j]['*option no.'] || rows[j]['*options text']) {
									let answer = false;

									if (
										(worksheetDetail.type == 'Quiz' || worksheetDetail.type == 'Quiz (Randomised)') &&
										question_type == 'MCQ' &&
										rows[j]['answer key(yes/no)'] == ''
									) {
										worksheetDetail.errorMsg.push('Answer Key is required.');
										worksheetDetail.isError = true;
									}

									if (
										(worksheetDetail.type == 'Quiz' || worksheetDetail.type == 'Quiz (Randomised)') &&
										rows[j]['answer key(yes/no)'] != '' &&
										question_type == 'MCQ'
									) {
										let key = rows[j]['answer key(yes/no)'].toLowerCase();
										if (key == 'no' || key == 'false' || key == false) {
											answer = false;
										}
										if (key == 'yes' || key == 'true' || key == true) {
											answer = true;
										}
									}

									if (rows[j]['*option no.'] == '') {
										worksheetDetail.errorMsg.push('Option No. is required.');
										worksheetDetail.isError = true;
									} else if (parseInt(rows[j]['*option no.']) == NaN) {
										worksheetDetail.errorMsg.push('Option No. is invalid.');
										worksheetDetail.isError = true;
									}

									if (rows[j]['*options text'] == '') {
										worksheetDetail.errorMsg.push('Option Text is required.');
										worksheetDetail.isError = true;
									}

									let payload = {
										no: rows[j]['*option no.'],
										text: rows[j]['*options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['*sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
												spinQueScore: parseInt(question_spinQueScore),
											},
											Options: options,
										};

										if (options.length < 2) {
											worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
											worksheetDetail.isError = true;
										}

										worksheetDetail.Questions.push(payload);

										let QuestionsArray = worksheetDetail.Questions;

										if (
											worksheetDetail.type == 'Quiz (Randomised)' &&
											parseInt(worksheetDetail.quizRandCount) > QuestionsArray.length
										) {
											worksheetDetail.errorMsg.push('Please add random question as per random number.');
											worksheetDetail.isError = true;
										}

										options = [];
										i = j;
										flag = false;
									}
								} else {
									worksheetDetail.errorMsg.push('Please provide options all details.');
									worksheetDetail.isError = true;
								}
							}
						}
					}
				}

				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}

			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const PollExcel = async function (data, req, res) {
	try {
		console.log('---------pollCall---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
			'publish results to learners (yes/no)',
			'*result layout (scale/pie/bar)',
			'*question text',
			'*option no.',
			'*options text',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type: 'Poll',
					publishResult: rows[i]['publish results to learners (yes/no)'],
					chart: rows[i]['*result layout (scale/pie/bar)'],
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				//check Publish Result
				worksheetDetail.publishResult = worksheetDetail.publishResult
					? worksheetDetail.publishResult.toLowerCase()
					: '';
				if (
					worksheetDetail.publishResult == '' ||
					worksheetDetail.publishResult == 'no' ||
					worksheetDetail.publishResult == 'false' ||
					worksheetDetail.publishResult == false
				) {
					worksheetDetail.publishResult = false;
				} else {
					worksheetDetail.publishResult = true;
				}

				// Check Poll  Result Layout
				if ((await checkDataIsValidOrNot(worksheetDetail.chart)) == false) {
					worksheetDetail.errorMsg.push('Poll Result Layout is required.');
					worksheetDetail.isError = true;
				} else {
					//Check Valid Reult Layout  Type
					let resultTypes = ['Scale', 'Pie', 'Bar'];
					let flag = false;
					for (let type of resultTypes) {
						if (type.toLowerCase() == worksheetDetail.chart.toLowerCase()) {
							flag = true;
							worksheetDetail.chart = type;
							break;
						}
					}
				}

				if (rows[i]['*question text'] == '' || rows[i]['*question text'] == null) {
					worksheetDetail.errorMsg.push('Question text is required.');
					worksheetDetail.isError = true;
				}

				//Code Poll Question and Options
				if (worksheetDetail.type.toLowerCase() == 'poll') {
					console.log('----------pollINter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;

					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							//Question Validation
							if (rows[j]['*question text']) {
								if (rows[j]['*question text'] == '') {
									worksheetDetail.errorMsg.push('Question text is required.');
									worksheetDetail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
										},
										Options: options,
									};

									worksheetDetail.Questions.push(payload);

									question_text = null;
									question_type = null;

									if (options.length < 2) {
										worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
										worksheetDetail.isError = true;
									}

									let questionType = '';

									question_type = questionType;
									question_text = rows[j]['*question text'];
									options = [];
								} else {
									question_text = rows[j]['*question text'];
								}
							}

							//Option Validation
							if (worksheetDetail.type.toLowerCase() == 'poll') {
								if (rows[j]['*option no.'] || rows[j]['*options text']) {
									let answer = false;

									if (rows[j]['*option no.'] == '') {
										worksheetDetail.errorMsg.push('Option No. is required.');
										worksheetDetail.isError = true;
									} else if (parseInt(rows[j]['*option no.']) == NaN) {
										worksheetDetail.errorMsg.push('Option No. is invalid.');
										worksheetDetail.isError = true;
									}

									if (rows[j]['*options text'] == '') {
										worksheetDetail.errorMsg.push('Option Text is required.');
										worksheetDetail.isError = true;
									}

									let payload = {
										no: rows[j]['*option no.'],
										text: rows[j]['*options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['*sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
											},
											Options: options,
										};

										if (options.length < 2) {
											worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
											worksheetDetail.isError = true;
										}

										worksheetDetail.Questions.push(payload);

										options = [];
										i = j;
										flag = false;
									}
								} else {
									worksheetDetail.errorMsg.push('Please provide questions or options all details');
									worksheetDetail.isError = true;
								}
							}
						}
					}
				}

				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}
			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const WordCloudExcel = async function (data, req, res) {
	try {
		console.log('---------Word Cloud Call---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
			'*question text',
			'answers per participant',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type: 'Word Cloud',
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				if (rows[i]['*question text'] == '') {
					worksheetDetail.errorMsg.push('Question text is required.');
					worksheetDetail.isError = true;
				}

				//Code WordCloud Question and Options
				if (worksheetDetail.type.toLowerCase() == 'word cloud') {
					console.log('----------WordCloudINter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;

					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							//Question Validation
							let payload = {
								Question: {
									text: rows[j]['*question text'],
									answerCount: rows[j]['answers per participant'],
								},
								Options: [],
							};
							worksheetDetail.Questions.push(payload);
						}
					}
				}

				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}
			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const SurveyExcel = async function (data, req, res) {
	try {
		console.log('---------SurveyCall---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'session feedback survey(yes/no)',
			'facilitator instructions',
			'survey is anonymous(yes/no)',
			'survey is trainer only(yes/no)',
			'trainer survey compulsory(yes/no)',
			'add questions group (yes/no)',
			'add group name',
			'enter group name for question',
			'*question type(mcq/rating scale/short answer/long answer/file upload/drop down/date/date time/mobile no/email/geo tag)',
			'*question no.',
			'*questions text',
			'character limit',
			'option no.',
			'options text',
			'multiple selection (yes/no)',
			'file types allowed(pdf/video/image/audio) add multiple files  comma separated',
			'maximum number of files allowed (1/2/3)',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					sessionFeedback: rows[i]['session feedback survey(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					anonymous: rows[i]['survey is anonymous(yes/no)'],
					trainerSurvey: rows[i]['survey is trainer only(yes/no)'],
					trainerSurveyComp: rows[i]['trainer survey compulsory(yes/no)'],
					question_Group: rows[i]['add questions group (yes/no)'],
					questionGroups: rows[i]['add group name'],

					questionType:
						rows[i][
							'*question type(mcq/rating scale/short answer/long answer/file upload/drop down/date/date time/mobile no/email/geo tag)'
						],
					surveyCharcterLimit: rows[i]['character limit'],
					multipleOption: rows[i]['multiple selection (yes/no)'],
					allowFileTypes: rows[i]['file types allowed(pdf/video/image/audio) add multiple files  comma separated'],
					numberOfFiles: rows[i]['maximum number of files allowed (1/2/3)'],
					type: 'Survey',
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				//check Session Feedback
				worksheetDetail.sessionFeedback = worksheetDetail.sessionFeedback
					? worksheetDetail.sessionFeedback.toLowerCase()
					: '';

				if (!worksheetDetail.trainerSurvey) {
					if (
						worksheetDetail.sessionFeedback == '' ||
						worksheetDetail.sessionFeedback == 'no' ||
						worksheetDetail.sessionFeedback == 'false' ||
						worksheetDetail.sessionFeedback == false
					) {
						worksheetDetail.sessionFeedback = false;
					} else {
						worksheetDetail.sessionFeedback = true;
					}
				} else {
					worksheetDetail.sessionFeedback = false;
				}

				//check Survey anonymous
				worksheetDetail.anonymous = worksheetDetail.anonymous ? worksheetDetail.anonymous.toLowerCase() : '';
				if (
					worksheetDetail.anonymous == '' ||
					worksheetDetail.anonymous == 'no' ||
					worksheetDetail.anonymous == 'false' ||
					worksheetDetail.anonymous == false
				) {
					worksheetDetail.anonymous = false;
				} else {
					worksheetDetail.anonymous = true;
				}

				//check Survey trainerSurvey
				worksheetDetail.trainerSurvey = worksheetDetail.trainerSurvey
					? worksheetDetail.trainerSurvey.toLowerCase()
					: '';

				if (!worksheetDetail.sessionFeedback) {
					if (
						worksheetDetail.trainerSurvey == '' ||
						worksheetDetail.trainerSurvey == 'no' ||
						worksheetDetail.trainerSurvey == 'false' ||
						worksheetDetail.trainerSurvey == false
					) {
						worksheetDetail.trainerSurvey = false;
					} else {
						worksheetDetail.trainerSurvey = true;
					}
				} else {
					worksheetDetail.trainerSurvey = false;
				}

				//check Survey trainer Survey Compulsory
				worksheetDetail.trainerSurveyComp = worksheetDetail.trainerSurveyComp
					? worksheetDetail.trainerSurveyComp.toLowerCase()
					: '';

				if (worksheetDetail.trainerSurvey) {
					if (
						worksheetDetail.trainerSurveyComp == '' ||
						worksheetDetail.trainerSurveyComp == 'no' ||
						worksheetDetail.trainerSurveyComp == 'false' ||
						worksheetDetail.trainerSurveyComp == false
					) {
						worksheetDetail.trainerSurveyComp = false;
					} else {
						worksheetDetail.trainerSurveyComp = true;
					}
				} else {
					worksheetDetail.trainerSurveyComp = false;
				}

				//check add Question Group
				worksheetDetail.question_Group = worksheetDetail.question_Group
					? worksheetDetail.question_Group.toLowerCase()
					: '';
				if (
					worksheetDetail.question_Group == '' ||
					worksheetDetail.question_Group == 'no' ||
					worksheetDetail.question_Group == 'false' ||
					worksheetDetail.question_Group == false
				) {
					worksheetDetail.question_Group = false;
				} else {
					worksheetDetail.question_Group = true;
				}

				if (worksheetDetail.question_Group && (await checkDataIsValidOrNot(worksheetDetail.questionGroups)) == false) {
					worksheetDetail.errorMsg.push('Survey add Group Name is required.');
					worksheetDetail.isError = true;
				} else {
					worksheetDetail.questionGroups = worksheetDetail.questionGroups
						.replace(/'/g, '')
						.split(',')
						.map((item) => item.trim());
				}

				//Code Suvrey Question and Options
				if (worksheetDetail.type.toLowerCase() == 'survey') {
					console.log('----------SurveyQuestionEnter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;
					let multiple_Option = null;
					let charcter_Limit = null;
					let group_name = null;

					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						let quesType =
							rows[j][
								'*question type(mcq/rating scale/short answer/long answer/file upload/drop down/date/date time/mobile no/email/geo tag)'
							].toLowerCase();

						if (flag) {
							//Question Validation
							if (rows[j]['*question no.'] || quesType || rows[j]['*questions text']) {
								if (rows[j]['*question no.'] == '' || rows[j]['*question no.'] == null) {
									worksheetDetail.errorMsg.push('Question No. is required.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question no.']) == NaN) {
									worksheetDetail.errorMsg.push('Question No. is invalid.');
									worksheetDetail.isError = true;
								}

								if (quesType == '' && worksheetDetail.type == 'Survey') {
									worksheetDetail.errorMsg.push('Question type is required.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*questions text'] == '') {
									worksheetDetail.errorMsg.push('Question text is required.');
									worksheetDetail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											numberOfFiles: rows[j]['maximum number of files allowed (1/2/3)'],
											allowFileTypes:
												rows[j]['file types allowed(pdf/video/image/audio) add multiple files  comma separated'],
											surveyCharcterLimit: charcter_Limit,
											multipleOption: multiple_Option,
											groupname: group_name,
										},
										Options: options,
									};

									worksheetDetail.Questions.push(payload);

									question_text = null;
									question_type = null;
									multiple_Option = null;
									charcter_Limit = null;
									group_name = null;

									if (options.length < 2) {
										worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
										worksheetDetail.isError = true;
									}

									let questionType = '';
									let multipleOption_ = '';
									let charcterLimit_ = '';
									let groupname_ = '';

									if (quesType == 'mcq') {
										questionType = 'MCQ';
									} else if (quesType == 'drag and drop') {
										questionType = 'Drag and Drop';
									} else if (quesType == 'rating scale') {
										questionType = 'Rating scale';
									} else if (quesType == 'short answer') {
										questionType = 'Short answer';
									} else if (quesType == 'long answer') {
										questionType = 'Long answer';
									} else if (quesType == 'file upload') {
										questionType = 'File upload';
									} else if (quesType == 'drop down') {
										questionType = 'Drop Down';
									} else if (quesType == 'date') {
										questionType = 'Date';
									} else if (quesType == 'date time') {
										questionType = 'Date Time';
									} else if (quesType == 'mobile no') {
										questionType = 'Mobile No';
									} else if (quesType == 'email') {
										questionType = 'Email';
									} else if (quesType == 'geo tag') {
										questionType = 'Geo Tag';
									}

									multipleOption_ = rows[j]['multiple selection (yes/no)'];
									charcterLimit_ = rows[j]['character limit'];
									groupname_ = rows[j]['enter group name for question'];

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									multiple_Option = multipleOption_;
									charcter_Limit = charcterLimit_;
									group_name = groupname_;

									options = [];
								} else {
									let questionType = '';
									let multipleOption_ = '';

									if (quesType == 'mcq') {
										questionType = 'MCQ';
									} else if (quesType == 'drag and drop') {
										questionType = 'Drag and Drop';
									} else if (quesType == 'rating scale') {
										questionType = 'Rating scale';
									} else if (quesType == 'short answer') {
										questionType = 'Short answer';
									} else if (quesType == 'long answer') {
										questionType = 'Long answer';
									} else if (quesType == 'file upload') {
										questionType = 'File upload';
									} else if (quesType == 'drop down') {
										questionType = 'Drop Down';
									} else if (quesType == 'date') {
										questionType = 'Date';
									} else if (quesType == 'date time') {
										questionType = 'Date Time';
									} else if (quesType == 'mobile no') {
										questionType = 'Mobile No';
									} else if (quesType == 'email') {
										questionType = 'Email';
									} else if (quesType == 'geo tag') {
										questionType = 'Geo Tag';
									}

									multipleOption_ = rows[j]['multiple selection (yes/no)'];
									charcterLimit_ = rows[j]['character limit'];
									groupname_ = rows[j]['enter group name for question'];

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									multiple_Option = multipleOption_;
									charcter_Limit = charcterLimit_;
									group_name = groupname_;
									console.log('---else here---------');
								}

								if (
									worksheetDetail.type == 'Survey' &&
									quesType != 'mcq' &&
									quesType != 'rating scale' &&
									quesType != 'drop down'
								) {
									let questionType = '';
									if (quesType == 'short answer') {
										questionType = 'Short answer';
									} else if (quesType == 'long answer') {
										questionType = 'Long answer';
									} else if (quesType == 'file upload') {
										questionType = 'File upload';
									} else if (quesType == 'date') {
										questionType = 'Date';
									} else if (quesType == 'date time') {
										questionType = 'Date Time';
									} else if (quesType == 'mobile no') {
										questionType = 'Mobile No';
									} else if (quesType == 'email') {
										questionType = 'Email';
									} else if (quesType == 'geo tag') {
										questionType = 'Geo Tag';
									}

									if (
										(questionType == 'Short answer' || questionType == 'Long answer') &&
										rows[j]['character limit'] == ''
									) {
										worksheetDetail.errorMsg.push('Survey Character limit is required.');
										worksheetDetail.isError = true;
									}

									// Check File Upload Type for Survey
									if (
										worksheetDetail.type == 'Survey' &&
										quesType == 'file upload' &&
										rows[j]['file types allowed(pdf/video/image/audio) add multiple files  comma separated'] == ''
									) {
										worksheetDetail.errorMsg.push('Allow File Type is required.');
										worksheetDetail.isError = true;
									} else {
										//Check Valid Show  Type
										if (quesType == 'file upload') {
											let resultTypes = ['PDF', 'Audio', 'Video', 'Image'];
											let flag = false;
											for (let type of resultTypes) {
												if (
													type.toLowerCase() ==
													rows[j][
														'file types allowed(pdf/video/image/audio) add multiple files  comma separated'
													].toLowerCase()
												) {
													flag = true;
													worksheetDetail.allowFileTypes = type;
													break;
												}
											}
										}
									}

									let payload = {
										Question: {
											text: rows[j]['*questions text'],
											type: questionType,
											numberOfFiles: worksheetDetail.numberOfFiles,
											allowFileTypes: worksheetDetail.allowFileTypes,
											surveyCharcterLimit: rows[j]['character limit'],
											groupname: rows[j]['enter group name for question'],
										},
										Options: [],
									};
									i = j;
									worksheetDetail.Questions.push(payload);
								}
							}

							// //Option Validation
							if (
								worksheetDetail.type.toLowerCase() == 'survey' &&
								(question_type == 'MCQ' || question_type == 'Rating scale' || question_type == 'Drop Down')
							) {
								if (rows[j]['option no.'] || rows[j]['options text']) {
									let answer = false;

									if (rows[j]['option no.'] == '') {
										worksheetDetail.errorMsg.push('Option No. is required.');
										worksheetDetail.isError = true;
									} else if (parseInt(rows[j]['option no.']) == NaN) {
										worksheetDetail.errorMsg.push('Option No. is invalid.');
										worksheetDetail.isError = true;
									}

									if (rows[j]['options text'] == '') {
										worksheetDetail.errorMsg.push('Option Text is required.');
										worksheetDetail.isError = true;
									}

									let payload = {
										no: rows[j]['option no.'],
										text: rows[j]['options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['*sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
												multipleOption: multiple_Option,
												surveyCharcterLimit: charcter_Limit,
												groupname: group_name,
											},
											Options: options,
										};

										if (options.length < 2) {
											worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
											worksheetDetail.isError = true;
										}

										worksheetDetail.Questions.push(payload);

										options = [];
										i = j;
										flag = false;
									}
								} else {
									worksheetDetail.errorMsg.push('Please provide questions or options all details');
									worksheetDetail.isError = true;
								}
							}
						}
					}
				}

				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}

			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const offlineTaskExcel = async function (data, req, res) {
	try {
		console.log('---------OfflineTaskcall---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'add to assessment (yes/no)',
			'facilitator instructions',
			'task brief',
			'*question no.',
			'*questions text',
			'text response required(yes/no)',
			'file submission required(yes/no)',
			'file types allowed(pdf/video/image/audio) add multiple files with comma separated',
			'maximum number of files allowed(1/2/3)',
		];
		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}
		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}
		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					isAssessment: rows[i]['add to assessment (yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					brief: rows[i]['task brief'],
					isTextResponse: rows[i]['text response required(yes/no)'],
					isFileSubmission: rows[i]['file submission required(yes/no)'],
					allowFileTypes: rows[i]['file types allowed(pdf/video/image/audio) add multiple files with comma separated'],
					numberOfFiles: rows[i]['maximum number of files allowed(1/2/3)'],
					type: 'Offline Task',
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}
				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				//check offline task assesment
				worksheetDetail.isAssessment = worksheetDetail.isAssessment ? worksheetDetail.isAssessment.toLowerCase() : '';
				if (
					worksheetDetail.isAssessment == '' ||
					worksheetDetail.isAssessment == 'no' ||
					worksheetDetail.isAssessment == 'false' ||
					worksheetDetail.isAssessment == false
				) {
					worksheetDetail.isAssessment = false;
				} else {
					worksheetDetail.isAssessment = true;
				}

				//Code Offline Task Question and Options
				if (worksheetDetail.type.toLowerCase() == 'offline task') {
					console.log('----------OfflineTaskQuestionEnter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}
						if (flag) {
							//Question Validation
							if (rows[j]['*question no.'] || rows[j]['*questions text']) {
								if (rows[j]['*question no.'] == '' || rows[j]['*question no.'] == null) {
									worksheetDetail.errorMsg.push('Question No. is required.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question no.']) == NaN) {
									worksheetDetail.errorMsg.push('Question No. is invalid.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*questions text'] == '') {
									worksheetDetail.errorMsg.push('Question text is required.');
									worksheetDetail.isError = true;
								}

								//check isTextResponse
								worksheetDetail.isTextResponse = rows[j]['text response required(yes/no)']
									? rows[j]['text response required(yes/no)'].toLowerCase()
									: '';
								if (
									worksheetDetail.isTextResponse == '' ||
									worksheetDetail.isTextResponse == 'no' ||
									worksheetDetail.isTextResponse == 'false' ||
									worksheetDetail.isTextResponse == false
								) {
									worksheetDetail.isTextResponse = false;
								} else {
									worksheetDetail.isTextResponse = true;
								}
								//check isFileSubmission
								worksheetDetail.isFileSubmission = rows[j]['file submission required(yes/no)']
									? rows[j]['file submission required(yes/no)'].toLowerCase()
									: '';
								if (
									worksheetDetail.isFileSubmission == '' ||
									worksheetDetail.isFileSubmission == 'no' ||
									worksheetDetail.isFileSubmission == 'false' ||
									worksheetDetail.isFileSubmission == false
								) {
									worksheetDetail.isFileSubmission = false;
								} else {
									worksheetDetail.isFileSubmission = true;
								}

								let payload = {
									Question: {
										text: rows[j]['*questions text'],
										numberOfFiles: rows[j]['maximum number of files allowed(1/2/3)'],
										isTextResponse:
											worksheetDetail.isTextResponse != '' && worksheetDetail.isTextResponse != null
												? worksheetDetail.isTextResponse
												: false,
										isFileSubmission:
											worksheetDetail.isFileSubmission != '' && worksheetDetail.isFileSubmission != null
												? worksheetDetail.isFileSubmission
												: false,
										allowFileTypes:
											rows[j]['file types allowed(pdf/video/image/audio) add multiple files with comma separated'],
									},
									Options: [],
								};
								// Check File Upload Type for offline Task
								if (worksheetDetail.isFileSubmission) {
									if (
										rows[j]['file types allowed(pdf/video/image/audio) add multiple files with comma separated'] == ''
									) {
										worksheetDetail.errorMsg.push('Allow File Type is required.');
										worksheetDetail.isError = true;
									} else {
										//Check Valid Show  Type
										let resultTypes = ['PDF', 'Audio', 'Video', 'Image'];
										let flag = false;
										for (let type of resultTypes) {
											if (
												type.toLowerCase() ==
												rows[j][
													'file types allowed(pdf/video/image/audio) add multiple files with comma separated'
												].toLowerCase()
											) {
												flag = true;
												worksheetDetail.allowFileTypes = type;
												break;
											}
										}
									}
								}
								i = j;
								worksheetDetail.Questions.push(payload);
							}
						}
					}
				}
				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}
			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

const SpinTheWheelExcel = async function (data, req, res) {
	try {
		console.log('---------Spin The Wheel Call---------');
		worksheetList = [];
		let excelHearders = [
			'*sr. no.',
			'worksheet no',
			'activity label',
			'description',
			'flag important(yes/no)',
			'group task(yes/no)',
			'facilitator instructions',
			'spin the wheel is graded (yes/no)',
			'publish leaderboard to learners (yes/no)',
			'*total questions in category',
			'*no. of spins for each learner',
			'*question categories',
			'*question no.',
			'*question type(mcq/drag & drop)',
			'*questions text',
			'*question score',
			'*question category',
			'*option no.',
			'*options text',
			'answer key(yes/no)',
		];

		let rows = [];
		for (let item of data) {
			if (await checkDatailsPresentOrNot(item)) {
				rows.push(item);
			}
		}

		let validHeader = true;
		for (let header of excelHearders) {
			if (rows[0][header] == undefined) {
				console.log('-----header---', header);
				validHeader = false;
			}
		}

		if (validHeader) {
			for (let i = 0; i < rows.length; i++) {
				let worksheetDetail = {
					errorMsg: [],
					srNo: rows[i]['*sr. no.'],
					worksheetNo: rows[i]['worksheet no'],
					activityTemplate: rows[i]['activity label'],
					description: rows[i]['description'],
					flgImp: rows[i]['flag important(yes/no)'],
					flgGroupActivty: rows[i]['group task(yes/no)'],
					trainerInst: rows[i]['facilitator instructions'],
					type: 'Spin The Wheel',
					isGraded: rows[i]['spin the wheel is graded (yes/no)'],
					publishResult: rows[i]['publish leaderboard to learners (yes/no)'],
					noOfQuesForCategory: rows[i]['*total questions in category'],
					noOfTimeSpinWheel: rows[i]['*no. of spins for each learner'],
					showQueCategory: false,
					spinWheelQueCategory: rows[i]['*question categories'],
					quizRandCount: rows[i]['number of random questions for each learner'],
					Questions: [],
				};

				for (const [key, value] of Object.entries(rows[i])) {
					const result = await containsDangerousChars(value, key);
					if (result.isUnsafe) {
						worksheetDetail.errorMsg.push(`${result.reason}`);
						worksheetDetail.isError = true;
						break;
					}
				}

				//check Flag Important
				worksheetDetail.flgImp = worksheetDetail.flgImp ? worksheetDetail.flgImp.toLowerCase() : '';
				if (
					worksheetDetail.flgImp == '' ||
					worksheetDetail.flgImp == 'no' ||
					worksheetDetail.flgImp == 'false' ||
					worksheetDetail.flgImp == false
				) {
					worksheetDetail.flgImp = false;
				} else {
					worksheetDetail.flgImp = true;
				}

				//check flag Group Task
				worksheetDetail.flgGroupActivty = worksheetDetail.flgGroupActivty
					? worksheetDetail.flgGroupActivty.toLowerCase()
					: '';
				if (
					worksheetDetail.flgGroupActivty == '' ||
					worksheetDetail.flgGroupActivty == 'no' ||
					worksheetDetail.flgGroupActivty == 'false' ||
					worksheetDetail.flgGroupActivty == false
				) {
					worksheetDetail.flgGroupActivty = false;
				} else {
					worksheetDetail.flgGroupActivty = true;
				}

				//check Quiz Graded or not
				worksheetDetail.isGraded = worksheetDetail.isGraded ? worksheetDetail.isGraded.toLowerCase() : '';
				if (
					worksheetDetail.isGraded == '' ||
					worksheetDetail.isGraded == 'no' ||
					worksheetDetail.isGraded == 'false' ||
					worksheetDetail.isGraded == false
				) {
					worksheetDetail.isGraded = false;
				} else {
					worksheetDetail.isGraded = true;
				}

				//check Publish Result
				worksheetDetail.publishResult = worksheetDetail.publishResult
					? worksheetDetail.publishResult.toLowerCase()
					: '';
				if (
					worksheetDetail.publishResult == '' ||
					worksheetDetail.publishResult == 'no' ||
					worksheetDetail.publishResult == 'false' ||
					worksheetDetail.publishResult == false
				) {
					worksheetDetail.publishResult = false;
				} else {
					worksheetDetail.publishResult = true;
				}

				if ((await checkDataIsValidOrNot(worksheetDetail.noOfQuesForCategory)) == false) {
					worksheetDetail.errorMsg.push('Total questions in category is required.');
					worksheetDetail.isError = true;
				} else {
					worksheetDetail.showQueCategory = true;
				}

				if ((await checkDataIsValidOrNot(worksheetDetail.noOfTimeSpinWheel)) == false) {
					worksheetDetail.errorMsg.push('No. of spins for each learner is required.');
					worksheetDetail.isError = true;
				}

				if ((await checkDataIsValidOrNot(worksheetDetail.spinWheelQueCategory)) == false) {
					worksheetDetail.errorMsg.push('Question categories is required.');
					worksheetDetail.isError = true;
				} else {
					// Clean and split string into array of category names
					const categories = worksheetDetail.spinWheelQueCategory
						.replace(/'/g, '')
						.split(',')
						.map((item) => item.trim());

					// Assign cleaned array back
					worksheetDetail.spinWheelQueCategory = categories;

					// Create payload array
					worksheetDetail.spinWheelQueCategory = categories.map((category, index) => ({
						category_index: index + 1,
						category_name: category,
						totalquestion: 0,
						totalscore: 0,
						characterRemain: 0,
					}));
				}

				// console.log('-worksheetDetail-', worksheetDetail);

				if (parseInt(worksheetDetail.noOfTimeSpinWheel) + 2 > worksheetDetail?.spinWheelQueCategory?.length) {
					worksheetDetail.errorMsg.push('Categories should be 2 more than number of spins.');
					worksheetDetail.isError = true;
				}

				//Code Quiz Question and Options
				if (worksheetDetail.type.toLowerCase() == 'spin the wheel') {
					console.log('----------spin the wheel enter--------------');
					let questionIndex = i;
					let totalLength = rows.length;
					let flag = true;
					let question_text = null;
					let question_type = null;

					let options = [];
					for (let j = questionIndex; j < totalLength; j++) {
						if (rows[j]['*sr. no.'] != '' && j != questionIndex) {
							console.log('--EXIT--');
							totalLength = j;
							i = j - 1;
							flag = false;
						}

						if (flag) {
							//Question Validation
							if (
								rows[j]['*question no.'] ||
								rows[j]['*question type(mcq/drag & drop)'] ||
								rows[j]['*questions text'] ||
								rows[j]['*question score'] ||
								rows[j]['*question category']
							) {
								if (rows[j]['*question no.'] == '' || rows[j]['*question no.'] == null) {
									worksheetDetail.errorMsg.push('Question No. is required.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question no.']) == NaN) {
									worksheetDetail.errorMsg.push('Question No. is invalid.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*question type(mcq/drag & drop)'] == '' && worksheetDetail.type == 'Spin The Wheel') {
									worksheetDetail.errorMsg.push('Question Type is required.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*questions text'] == '') {
									worksheetDetail.errorMsg.push('Questions text is required.');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*question score'] == '' || rows[j]['*question score'] == null) {
									worksheetDetail.errorMsg.push('Question Score is required.');
									worksheetDetail.isError = true;
								} else if (isNaN(rows[j]['*question score'])) {
									worksheetDetail.errorMsg.push('Question score must be in numerical form.');
									worksheetDetail.isError = true;
								} else if (parseInt(rows[j]['*question score']) <= 0) {
									worksheetDetail.errorMsg.push('Please add score greate than 0');
									worksheetDetail.isError = true;
								}

								if (rows[j]['*question category'] == '' || rows[j]['*question category'] == null) {
									worksheetDetail.errorMsg.push('Question category is required.');
									worksheetDetail.isError = true;
								}

								if (options && options.length > 0) {
									let payload = {
										Question: {
											text: question_text,
											type: question_type,
											spinQueScore: parseInt(question_spinQueScore),
											spinCatIndex: question_spinCatIndex,
										},
										Options: options,
									};

									let categories = worksheetDetail.spinWheelQueCategory;

									// Replace category name with category index in questions
									let catName = payload.Question.spinCatIndex;
									for (let l = 0; l < categories.length; l++) {
										if (categories[l].category_name === catName) {
											payload.Question.spinCatIndex = categories[l].category_index;
											categories[l].totalquestion = categories[l].totalquestion + 1;
											categories[l].totalscore = categories[l].totalscore + payload.Question.spinQueScore;
										}
									}

									worksheetDetail.Questions.push(payload);

									question_text = null;
									question_type = null;
									question_spinQueScore = 0;
									question_spinCatIndex = null;

									if (options.length < 2) {
										worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
										worksheetDetail.isError = true;
									}

									let questionType = '';
									if (rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'mcq') {
										questionType = 'MCQ';
									} else if (
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag and drop' ||
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag & drop'
									) {
										questionType = 'Drag and Drop';
									}

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									question_spinQueScore = rows[j]['*question score'];
									question_spinCatIndex = rows[j]['*question category'];

									options = [];
								} else {
									let questionType = '';
									if (rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'mcq') {
										questionType = 'MCQ';
									} else if (
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag and drop' ||
										rows[j]['*question type(mcq/drag & drop)'].toLowerCase() == 'drag & drop'
									) {
										questionType = 'Drag and Drop';
									}

									question_type = questionType;
									question_text = rows[j]['*questions text'];
									question_spinQueScore = rows[j]['*question score'];
									question_spinCatIndex = rows[j]['*question category'];
								}
							}

							//Option Validation
							if (worksheetDetail.type.toLowerCase() == 'spin the wheel') {
								if (rows[j]['*option no.'] || rows[j]['*options text']) {
									let answer = false;

									if (
										worksheetDetail.type == 'Spin The Wheel' &&
										question_type == 'MCQ' &&
										rows[j]['answer key(yes/no)'] == ''
									) {
										worksheetDetail.errorMsg.push('Answer Key is required.');
										worksheetDetail.isError = true;
									}

									if (
										worksheetDetail.type == 'Spin The Wheel' &&
										rows[j]['answer key(yes/no)'] != '' &&
										question_type == 'MCQ'
									) {
										let key = rows[j]['answer key(yes/no)'].toLowerCase();
										if (key == 'no' || key == 'false' || key == false) {
											answer = false;
										}
										if (key == 'yes' || key == 'true' || key == true) {
											answer = true;
										}
									}

									if (rows[j]['*option no.'] == '') {
										worksheetDetail.errorMsg.push('Option No. is required.');
										worksheetDetail.isError = true;
									} else if (parseInt(rows[j]['*option no.']) == NaN) {
										worksheetDetail.errorMsg.push('Option No. is invalid.');
										worksheetDetail.isError = true;
									}

									if (rows[j]['*options text'] == '') {
										worksheetDetail.errorMsg.push('Option Text is required.');
										worksheetDetail.isError = true;
									}

									let payload = {
										no: rows[j]['*option no.'],
										text: rows[j]['*options text'],
										isCurrectAnswer: answer,
									};
									options.push(payload);

									if (j == rows.length - 1 || (rows[j + 1]['*sr. no.'] != '' && j + 1 != questionIndex)) {
										let payload = {
											Question: {
												text: question_text,
												type: question_type,
												spinQueScore: parseInt(question_spinQueScore),
												spinCatIndex: question_spinCatIndex,
											},
											Options: options,
										};

										if (options.length < 2) {
											worksheetDetail.errorMsg.push('Please add mininmum 2 Options.');
											worksheetDetail.isError = true;
										}

										let categories = worksheetDetail.spinWheelQueCategory;

										// Replace category name with category index in questions
										let catName = payload.Question.spinCatIndex;
										for (let l = 0; l < categories.length; l++) {
											if (categories[l].category_name === catName) {
												payload.Question.spinCatIndex = categories[l].category_index;
												categories[l].totalquestion = categories[l].totalquestion + 1;
												categories[l].totalscore = categories[l].totalscore + payload.Question.spinQueScore;
											}
										}

										worksheetDetail.Questions.push(payload);

										if (worksheetDetail.Questions.length < worksheetDetail.spinWheelQueCategory.length) {
											worksheetDetail.errorMsg.push('Questions can not be less than question categories');
											worksheetDetail.isError = true;
										}

										options = [];
										i = j;
										flag = false;
									}
								} else {
									worksheetDetail.errorMsg.push('Please provide questions or options all details');
									worksheetDetail.isError = true;
								}
							}
						}
					}
				}

				// Check if every category has at least one question
				let notUsed = [];

				let categories = worksheetDetail.spinWheelQueCategory;

				for (let k = 0; k < categories.length; k++) {
					if (categories[k].totalquestion < parseInt(worksheetDetail.noOfQuesForCategory)) {
						if ((categories[k].totalquestion = 0)) {
							worksheetDetail.errorMsg.push(
								"Category with name '" + categories[k].category_name + "' has no questions."
							);
						} else {
							worksheetDetail.errorMsg.push(
								"Category with name '" + categories[k].category_name + ` has ${categories[k].totalquestion} questions.`
							);
						}
						worksheetDetail.isError = true;
					}
				}

				worksheetDetail.errorMsg = worksheetDetail.errorMsg.toString();
				worksheetDetail.Questions = JSON.stringify(worksheetDetail.Questions);
				worksheetList.push(worksheetDetail);
			}

			return worksheetList;
		} else {
			console.log('-------Error Not Valid Header-----');
		}
	} catch (error) {
		console.log('bulk Upload Error', error);
	}
};

async function updateExcelHeadersByType(headers, type) {
	const worksheetHeader = '*worksheet template (quiz/quiz (randomised))';
	const lessonHeader = '*lesson template (quiz/quiz (randomised))';

	return headers.map((header) => {
		if (header === worksheetHeader) {
			if (type === 1) {
				return worksheetHeader;
			} else if (type === 2 || type === 4) {
				return lessonHeader;
			}
		}
		return header;
	});
}

////////////////////////////////// Modules APIS ///////////////////////////////////

//get all diwo modules list
const getAllDiwoModuleTypeList = async function (req, res) {
	try {
		[err, moduleList] = await to(
			DiwoModule.findAll({
				where: {
					id: [1, 2, 4, 5],
				},
				order: [['id', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);
		return ResponseSuccess(res, {
			data: moduleList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllDiwoModuleTypeList = getAllDiwoModuleTypeList;

//get all module list by module type for creating course
const getAllModuleListByModuleType = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			moduleId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			moduleId: parseInt(req.params.moduleId),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, moduleId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		// let clientId = req.params.clientId;
		// let moduleId = req.params.moduleId;

		[err, moduleList] = await to(
			Workbook.findAll({
				where: {
					ClientId: clientId,
					DiwoModuleId: moduleId,
					haveCertificate: false,
					status: 'Published',
					isDeleted: false,
					allowNewLearner: false,
					allowWithoutPreAssign: false,
					default: true,
				},
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: moduleList,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllModuleListByModuleType = getAllModuleListByModuleType;

//get all certficate module list by module type for creating course
const getAllCertificateModuleByModuleType = async function (req, res) {
	try {
		const schema = Joi.object({
			clientId: Joi.number().integer().min(1).positive().required(),
			DiwoModuleId: Joi.number().integer().min(1).positive().required(),
		});
		const { error, value } = schema.validate({
			clientId: parseInt(req.params.clientId),
			DiwoModuleId: parseInt(req.params.moduleType),
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { clientId, DiwoModuleId } = value;

		//Check Client Access
		if (!(await checkClientIdAccess(req.user.ClientId, clientId))) {
			return ResponseError(res, { message: MESSAGE.NO_CLIENT_ACCESS }, 400);
		}

		//Get All Client Id Name
		// let clientId = req.params.clientId;
		let moduleDetails = [];
		let allSubClientIds = await getAllSubChildClientIds(parseInt(clientId));
		allSubClientIds.push(parseInt(clientId));

		//Find all Modules
		[err, moduleDetails] = await to(
			Workbook.findAll({
				where: {
					ClientId: allSubClientIds,
					DiwoModuleId: DiwoModuleId,
					haveCertificate: true,
					isDeleted: false,
					status: 'Published',
					allowNewLearner: false,
					allowWithoutPreAssign: false,
					default: true,
				},
				attributes: ['id', 'title', 'descrip', 'createdAt', 'updatedAt', 'BaseWorkbookId', 'version'],
				order: [['id', 'DESC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: moduleDetails,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllCertificateModuleByModuleType = getAllCertificateModuleByModuleType;

const getAllBadgesAndCertificate = async function (req, res) {
	try {
		//Get All Badges And Certificate
		let badges, certificates;
		let err;
		[err, badges] = await to(Badge.findAll());
		if (err) return ResponseError(res, err, 500, true);

		// [err, certificates] = await to(Certificate.findAll());
		// if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: { badges, certificates },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllBadgesAndCertificate = getAllBadgesAndCertificate;

const updateMediaCMSStatusInDiwoAssets = async function (_workbookId) {
	try {
		let workbookId = _workbookId;
		let diwoAsset;
		let workbook;
		let questions;

		[err, workbook] = await to(
			Workbook.findOne({
				where: {
					id: workbookId,
				},
				include: [
					{
						model: Worksheet,
						include: [
							{
								model: DiwoAsset,
								where: {
									forBrief: false,
									isTranscoding: false,
									type: 'Video',
								},
								include: [
									{
										model: MediaCMSUploadQueue,
									},
								],
							},
							{
								model: Question,
								include: [
									{
										model: DiwoAsset,
										where: {
											forBrief: false,
											isTranscoding: false,
											type: 'Video',
										},
										include: [
											{
												model: MediaCMSUploadQueue,
											},
										],
									},
								],
							},
						],
					},
				],
				order: [
					[
						{
							model: Worksheet,
						},
						'id',
						'ASC',
					],
				],
			})
		);
		if (err) {
			console.log('--------Error in get workbook for Media CMS While Update or Create Workbook-------', err);
		}
		let _workbook = workbook.convertToJSON();

		for (let worksheet of _workbook.Worksheets) {
			//Loop for Worksheet DiwoAssets
			if (worksheet.DiwoAssets && worksheet.DiwoAssets.length > 0) {
				for (let asset of worksheet.DiwoAssets) {
					if (asset.MediaCMSUploadQueue && asset.MediaCMSUploadQueue.id) {
						if (
							asset.MediaCMSUploadQueueId == asset.MediaCMSUploadQueue.id &&
							(asset.isTranscoding === false || asset.isTranscoding === null) &&
							(!asset.path || asset.path.trim() === '' || asset.path == null) &&
							asset.MediaCMSUploadQueue.path &&
							asset.MediaCMSUploadQueue.path.trim() !== '' &&
							asset.MediaCMSUploadQueue.isTranscoding === true
						) {
							// Update DiwoAsset
							[err, diwoAsset] = await to(
								DiwoAsset.update(
									{
										path: asset.MediaCMSUploadQueue.path,
										isTranscoding: true,
										MediaUploadStatus: 'completed',
										cmsVideoId: asset.MediaCMSUploadQueue.cmsVideoId,
									},
									{
										where: { id: asset.id },
									}
								)
							);

							if (err) {
								console.log('--------Error while updating DiwoAsset path from MediaCMSUploadQueue-------', err);
							}
						}
					}
				}
			}

			//Loop for Questions inside Worksheet
			if (worksheet.Questions && worksheet.Questions.length > 0) {
				for (let question of worksheet.Questions) {
					if (question.DiwoAssets && question.DiwoAssets.length > 0) {
						for (let asset of question.DiwoAssets) {
							if (asset.MediaCMSUploadQueue && asset.MediaCMSUploadQueue.id) {
								if (
									asset.MediaCMSUploadQueueId == asset.MediaCMSUploadQueue.id &&
									(asset.isTranscoding === false || asset.isTranscoding === null) &&
									(!asset.path || asset.path.trim() === '' || asset.path == null) &&
									asset.MediaCMSUploadQueue.path &&
									asset.MediaCMSUploadQueue.path.trim() !== '' &&
									asset.MediaCMSUploadQueue.isTranscoding === true
								) {
									// Update DiwoAsset
									[err, diwoAsset] = await to(
										DiwoAsset.update(
											{
												path: asset.MediaCMSUploadQueue.path,
												isTranscoding: true,
												MediaUploadStatus: 'completed',
												cmsVideoId: asset.MediaCMSUploadQueue.cmsVideoId,
											},
											{
												where: { id: asset.id },
											}
										)
									);

									if (err) {
										console.log(
											'--------Error while updating DiwoAsset path from MediaCMSUploadQueue for Question-------',
											err
										);
									}
								}
							}
						}
					}
				}
			}
		}

		return true;
	} catch (error) {
		if (error) {
			console.log('------Error in update MediaCMS Status In DiwoAssets While Update or Create Workbook-----', error);
		}
		return false;
	}
};
