// const path = require('path');
// const shortid = require('shortid');
// const multer = require('multer');
// const env = process.env.API_APP || 'development';
// const CONFIG = require('../config/config')[env];
// const Sequelize = require('sequelize');
// const filename = function (req, file, cb) {
// 	cb(null, shortid.generate() + '_' + Date.now() + path.parse(file.originalname).ext);
// };
// const multerError = (err) => {
// 	if (err) {
// 		console.log(err);
// 		return res.send({ error: 'file_too_large' });
// 	}
// 	return;
// };

// const uploadCsv = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/csv/',
// 		filename: filename,
// 	}),
// });

// // module.exports.uploadCsv = (file) => uploadCsv.single(file, multerError());
// module.exports.uploadCsv = (file) => uploadCsv.single(file);

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// module.exports.uploadContentFiles = (fields) => uploadContentFiles.fields(fields, multerError);
// const uploadTempExcel = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/excel',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadTempExcel = (file) => uploadTempExcel.single(file);

// const uploadAssets = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/assets',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadAssets = (fields) => uploadAssets.fields(fields, multerError);

// const uploadDocument = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/document',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDocument = (fields) => uploadDocument.fields(fields, multerError);

// const uploadDiwoAssets = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/diwo_assets',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDiwoAssets = (fields) => uploadDiwoAssets.fields(fields, multerError);

// const uploadLearnerSubmissions = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/learner_submission',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadLearnerSubmissions = (fields) => uploadLearnerSubmissions.fields(fields, multerError);

// const uploadDripLearnerBriefFiles = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/drip_learner_Brief',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDripLearnerBriefFiles = (fields) => uploadDripLearnerBriefFiles.fields(fields, multerError);

// const uploadDripAssets = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/drip_assets',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDripAssets = (fields) => uploadDripAssets.fields(fields, multerError);

// const uploadAvatar = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/client_avatar',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadAvatar = (fields) => uploadAvatar.fields(fields, multerError);

// const uploadDiwoCourseThumbnail = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/diwo_course_thumbnail',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDiwoCourseThumbnail = (fields) => uploadDiwoCourseThumbnail.fields(fields, multerError);

// const uploadDiwoPathwayThumbnail = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/diwo_pathway_thumbnail',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadDiwoPathwayThumbnail = (fields) => uploadDiwoPathwayThumbnail.fields(fields, multerError);

// const uploadSystemBranding = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/system_branding',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadSystemBranding = (fields) => uploadSystemBranding.fields(fields, multerError);

// const uploadOfferPdf = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/policy',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadOfferPdf = (fields) => uploadOfferPdf.fields(fields, multerError);

// const uploadSessionPhotgraphs = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/SessionPhotographs',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadSessionPhotgraphs = (fields) => uploadSessionPhotgraphs.fields(fields, multerError);

// const uploadZipFiles = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/zip_files',
// 		filename: filename,
// 	}),
// });
// module.exports.uploadZipFiles = (fields) => uploadZipFiles.fields(fields, multerError);

// const dowloadCustomJSReport = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/jsReport',
// 		filename: filename,
// 	}),
// });
// module.exports.dowloadCustomJSReport = (fields) => dowloadCustomJSReport.fields(fields, multerError);

// const dowloadAudioFile = multer({
// 	storage: multer.diskStorage({
// 		destination: CONFIG.imagePath + '/uploads/audio_files',
// 		filename: filename,
// 	}),
// });
// module.exports.dowloadAudioFile = (fields) => dowloadAudioFile.fields(fields, multerError);

const path = require('path');
const shortid = require('shortid');
const multer = require('multer');
const env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];

// Reusable filename generator
const filename = function (req, file, cb) {
	cb(null, shortid.generate() + '_' + Date.now() + path.extname(file.originalname));
};

// Reusable file type validation function
const fileFilter = (req, file, cb) => {
	const allowedMimeTypes = [
		'image/jpeg',
		'image/png',
		'image/gif', // Images
		'application/pdf', // PDFs
		'application/msword', // Word documents
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word documents (docx)
		'application/vnd.ms-excel', // Excel (xls)
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (xlsx)
		'text/csv', // CSV files
		'application/vnd.ms-powerpoint', // PowerPoint (ppt)
		'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint (pptx)
		'video/mp4',
		'video/mpeg',
		'video/quicktime', // Videos

		'application/zip', // Zip
		'application/x-zip-compressed', // Zip
		'multipart/x-zip', // Zip
		'application/octet-stream' // fallback Zip

	];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true); // Accept the file
	} else {
		cb(new Error('Invalid file type. Only specific file types are allowed!'), false); // Reject the file
	}
};

// Reusable multer configuration generator
const createMulterConfig = (destinationPath) => {
	return multer({
		storage: multer.diskStorage({
			destination: CONFIG.imagePath + destinationPath,
			filename: filename,
		}),
		fileFilter: fileFilter, // Add file type validation
		limits: { fileSize: 1.5 * 1024 * 1024 * 1024 }, // Optional: Limit file size to 1.5Gb
	});
};

// Apply the reusable multer configuration to all upload functions
const uploadCsv = createMulterConfig('/uploads/csv');
module.exports.uploadCsv = (file) => uploadCsv.single(file);

const uploadTempExcel = createMulterConfig('/uploads/excel');
module.exports.uploadTempExcel = (file) => uploadTempExcel.single(file);

const uploadAssets = createMulterConfig('/uploads/assets');
module.exports.uploadAssets = (fields) => uploadAssets.fields(fields);

const uploadDocument = createMulterConfig('/uploads/document');
module.exports.uploadDocument = (fields) => uploadDocument.fields(fields);

const uploadDiwoAssets = createMulterConfig('/uploads/diwo_assets');
module.exports.uploadDiwoAssets = (fields) => uploadDiwoAssets.fields(fields);

const uploadScormModules = createMulterConfig('/uploads/scorm_modules');
module.exports.uploadScormModules = (fields) => uploadScormModules.fields(fields);

const uploadLearnerSubmissions = createMulterConfig('/uploads/learner_submission');
module.exports.uploadLearnerSubmissions = (fields) => uploadLearnerSubmissions.fields(fields);

const uploadDripLearnerBriefFiles = createMulterConfig('/uploads/drip_learner_Brief');
module.exports.uploadDripLearnerBriefFiles = (fields) => uploadDripLearnerBriefFiles.fields(fields);

const uploadDripAssets = createMulterConfig('/uploads/drip_assets');
module.exports.uploadDripAssets = (fields) => uploadDripAssets.fields(fields);

const uploadAvatar = createMulterConfig('/uploads/client_avatar');
module.exports.uploadAvatar = (fields) => uploadAvatar.fields(fields);

const uploadDiwoCourseThumbnail = createMulterConfig('/uploads/diwo_course_thumbnail');
module.exports.uploadDiwoCourseThumbnail = (fields) => uploadDiwoCourseThumbnail.fields(fields);

const uploadDiwoPathwayThumbnail = createMulterConfig('/uploads/diwo_pathway_thumbnail');
module.exports.uploadDiwoPathwayThumbnail = (fields) => uploadDiwoPathwayThumbnail.fields(fields);

const uploadSystemBranding = createMulterConfig('/uploads/system_branding');
module.exports.uploadSystemBranding = (fields) => uploadSystemBranding.fields(fields);

const uploadOfferPdf = createMulterConfig('/uploads/policy');
module.exports.uploadOfferPdf = (fields) => uploadOfferPdf.fields(fields);

const uploadSessionPhotgraphs = createMulterConfig('/uploads/SessionPhotographs');
module.exports.uploadSessionPhotgraphs = (fields) => uploadSessionPhotgraphs.fields(fields);

const uploadZipFiles = createMulterConfig('/uploads/zip_files');
module.exports.uploadZipFiles = (fields) => uploadZipFiles.fields(fields);

const dowloadCustomJSReport = createMulterConfig('/uploads/jsReport');
module.exports.dowloadCustomJSReport = (fields) => dowloadCustomJSReport.fields(fields);

const dowloadAudioFile = createMulterConfig('/uploads/audio_files');
module.exports.dowloadAudioFile = (fields) => dowloadAudioFile.fields(fields);
