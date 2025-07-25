const express = require('express');
const router = express.Router();
const path = require('path');
const requestRaisedAuth = require('./../middleware/raiseRequestAuth');
const roleAuthorization = require('./../middleware/roleAuth');
const UploadService = require('../services/upload.service');
const MarketController = require('../controllers/market.controller');
const UserController = require('../controllers/user.controller');
const WebController = require('../controllers/web.controller');
const MenuController = require('../controllers/menu.controller');
const ClientController = require('../controllers/client.controller');
const DripController = require('../controllers/drip.controller');
const AssetController = require('../controllers/asset.controller');
const UserGroupController = require('../controllers/user-group.controller');
const LearnerController = require('../controllers/learner.controller');
const CampaignController = require('../controllers/campaign.controller');

const WorkbookController = require('../controllers/workbook.controller');
const SessionController = require('../controllers/session.controller');
const LicenseController = require('../controllers/license.controller');
const WhatsAppSetupController = require('../controllers/whatsapp_setup.controller');

const PWAController = require('../controllers/pwa.controller');

const PolicyController = require('../controllers/policy.controller');
const VimeoController = require('../controllers/vimeo.controller');
const ZoomController = require('../controllers/zoom.controller');
const TeamsController = require('../controllers/microsoft-teams.controller');
const AssistantAPIController = require('../controllers/assistant_api.controller');
const SupportController = require('../controllers/support.controller');
const NotifcationController = require('../controllers/notifcation.controller');
const WebhookController = require('../controllers/webhook.controller');
const ReportController = require('../controllers/report.controller');
const AnalyticsController = require('../controllers/analytics.controller');

const InterplayController = require('../controllers/interplay.controller');
const GoogleOAuthorisationController = require('../controllers/google_oauth.controller');
const CustomeTemplateController = require('../controllers/custom-template.controller');
const DiwoCourseController = require('../controllers/diwo-courses.controller');
const DiwoPathwayController = require('../controllers/diwo-pathways.controller');
const DiwoAssignmentController = require('../controllers/diwo-assignment.controller');
const AgentController = require('../controllers/agents.controller');
const DiwoCertificateController = require('../controllers/diwo-certificate.controller');
const NewPWAController = require('../controllers/new-pwa.controller');
const DiwoAnalyticsController = require('../controllers/diwo-analytics.controller');
const loginController = require('../controllers/login.controller');
const ARVRController = require('../controllers/ar-vr.controller');
const SystemMonitorController = require('../controllers/system_monitor.controller');
const { whtsapp_opt_in_schedulor } = require('../services/whats-app.service');

//////////////////////////////////////////////////////////////////////////////////////////////
const TestingDatbaseController = require('../controllers/testingDatabase.controller');

//////////////////////////////////////////////////////////////////////////////////////////////
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];

/* **file cleaner task** */
// require('../services/file.service');

/* JWT authentication and authorization */
const passport = require('passport');
require('./../middleware/passport')(passport);

/* default path */
router.get('/', function (req, res, next) {
	res.json({ status: 'success', message: 'Success', data: { version_number: CONFIG.version } });
});

// /////////////////////////////////////////////// ** Markets Controllers APIS ** /////////////////////////////////////////////////

//Get all Country List
router.get('/get-all-countries', MarketController.getCountries);

// Get Market Details By using Country Name
router.get('/markets/country/:country', MarketController.getMarketByCountry);

//Get all Role List
router.get('/get-all-roles/:roleId', MarketController.getRoles);

//Get all Market List For Policy URL Details
router.get(
	'/get-market-policy-url-details',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	MarketController.getMarketPolicyURLDetails
);

//Update all Market List For Policy URL Details
router.put(
	'/update-market-policy-url-details/:marketId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin']),
	MarketController.updateMarketPolicyURLDetails
);

//Get all Market List
router.get(
	'/get-all-market-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	MarketController.getAllMArket
);

//Get Login App Branding
router.get('/get-login-app-branding', MarketController.getLoginAppBranding);

//Get Login App Branding
router.post(
	'/update-login-app-branding',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	MarketController.updateLoginAppBranding
);

//Get Configurable Feature
router.get('/get-configurable-feature', MarketController.getConfigurableFeature);

//////////////////////////////////////////////// ** Vimeo APIS ** /////////////////////////////////////////////////

//create vimeo credential
router.post(
	'/create-vimeo-credential',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	VimeoController.createvimeoCredential
);

//update vimeo credential
router.put(
	'/update-vimeo-credential/:vimeoCredentialId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	VimeoController.updatevimeoCredential
);

//Delete vimeo credential
router.put(
	'/:clientId/delete-vimeoCredential',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	VimeoController.deleteVimeoCredentail
);

//get Client name List Of without vimeo-credential
router.get(
	'/get-client-name-list-of-without-vimeo-credential/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	VimeoController.getClientListOfWithoutVimeoCredential
);

//get vimeo credential list
router.get(
	'/get-all-vimeo-credential-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	VimeoController.getAllVideoCredential
);

//Get Client Vimeo Token
router.get(
	'/:clientId/assets/get-vimeo-token',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	AssetController.getClientVimeoToken
);

//Get Client Vimeo Token
router.get('/:campaignId/get-vimeo-token-by-campaign-id', AssetController.getClientVimeoTokenByCampaignId);

//check media cms transcoding status for Drip
router.post(
	'/check-mediaCMS-transcoding-status',
	passport.authenticate('jwt', { session: false }),
	VimeoController.getDripMediaCMSTranscodingStatus
);

//check media cms transcoding status for Diwo
router.post(
	'/check-diwo-mediaCMS-transcoding-status',
	passport.authenticate('jwt', { session: false }),
	VimeoController.getDiwoMediaCMSTranscodingStatus
);

router.post(
	'/:clientId/upload-video-on-mediacms',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAssets([{ name: 'Video', maxCount: 1 }]),
	VimeoController.uploadDripVideoOnMediacms
);

router.post(
	'/:clientId/upload-diwo-video-on-mediacms',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAssets([{ name: 'Video', maxCount: 1 }]),
	VimeoController.uploadDiwoVideoOnMediacms
);

router.post(
	'/check-video-can-upload-or-not',
	passport.authenticate('jwt', { session: false }),
	VimeoController.canUploadVideo
);

///////////////////////////////////////////////// ** Zoom App APIS ** /////////////////////////////////////////////////

//create Zoom App credential
router.post(
	'/create-zoom-app-credential',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	ZoomController.createZoomAppCredential
);

//update Zoom App credential
router.put(
	'/update-zoom-app-credential/:vimeoCredentialId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	ZoomController.updateZoomAppCredential
);

//get Client name List Of without Zoom App Details
router.get(
	'/get-client-name-list-of-without-zoom-app-credential/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	ZoomController.getClientListOfWithoutZoomAppCredential
);

//get Zoom App credential list
router.get(
	'/get-all-zoom-app-credential-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	ZoomController.getAllZoomAppCredential
);

//Get Zoom Redirect URL
router.post(
	'/get-zoom-redirect-url/:clientId',
	passport.authenticate('jwt', { session: false }),
	ZoomController.getZoomRedirectURL
);

//Zoom Call Back URL
router.get('/zoom/callback', ZoomController.zoomCallBack);

//Get Zoom Meetings
router.get(
	'/get-all-zoom-meetings/:clientId',
	passport.authenticate('jwt', { session: false }),
	ZoomController.getListOfZoomMeeting
);

//get Zoom sign in Details by using Client Id
router.get(
	'/get-zoom-sign-in-details-by-using-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	ZoomController.getZoomSignInDetailsByClientId
);

//Revoke Zoom Token
router.post(
	'/revoke-zoom-sign-in/:id',
	passport.authenticate('jwt', { session: false }),
	ZoomController.revokeZoomSignIn
);

//Checl Zoom Meeting list type
//Revoke Zoom Token
router.post(
	'/check-zoom-meeting-list-data/:clientId',
	passport.authenticate('jwt', { session: false }),
	ZoomController.checkZoomMeetingList
);

//Zoom Webhook
router.post('/zoom/webhook/remove-zoom-app', ZoomController.zoomWebhook);

///////////////////////////////////////////////// **Open AI Assistant APIS ** ////////////////////////////////////////////////

//get Assistant API credential list
router.get(
	'/get-all-assistant-api-credential-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AssistantAPIController.getAllAssistantAPIDetails
);

//get Client name List Of without Assistant APPI Details
router.get(
	'/get-client-name-list-of-without-assistant-api-credential/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AssistantAPIController.getClientListOfWithoutAssistantAPICredential
);

//Create or Update Assistance API credential
router.post(
	'/create-update-assistant-api-credential',
	passport.authenticate('jwt', { session: false }),
	AssistantAPIController.createUpdateAssistanceAPI
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////                           NEW LOGIN Controller                        ///////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ---------------------------------------------------------------PWA------------------------

//reset learner password
router.post('/learner-reset-password', loginController.learnerResetPassword);

//reset learner password token validity
router.post('/check-learner-reset-password-token-validity', loginController.checklearnerResetPasswordTokenValidity);

router.post('/learner-forgot-password', loginController.learnerForgotPassword);

//reset learner lock out flag
router.post(
	'/reset-learner-lockout-flag',
	passport.authenticate('jwt', { session: false }),
	loginController.learnerResetLockoutFlag
);

//Generate PWA OTP IF added in Config
router.post('/get-pwa-login-otp', loginController.newPWALoginOTP);

//Login PWA User
router.post('/get-pwa-validate-user', loginController.newPWALogin);

// --------------------------------------------------------------------WEB--------------------------------

//reset admin user password token validity
router.post('/check-admin-user-reset-password-token-validity', loginController.checkAdminResetPasswordTokenValidity);

//reset admin user password
router.post('/admin-user-reset-password', loginController.adminUserResetPassword);

router.post('/admin-user-forgot-password', loginController.adminUserForgotPassword);

//Generate Web OTP IF added in Config
router.post('/get-web-login-otp', loginController.newWebLoginOtp);

//Login Web User
router.post('/get-web-validate-user', loginController.newWebLogin);

///////////////////////////////////////////////// ** ARVR APIS ** /////////////////////////////////////////////////

//Login ARVR User
router.post('/ar-vr-login', ARVRController.newARVRLogin);

router.post(
	'/get-guide-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	ARVRController.getGuidList
);

router.post(
	'/get-learner-assigned-module-list',
	passport.authenticate('jwt-header', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	ARVRController.getAssignedModuleList
);

router.post(
	'/update-module-details',
	passport.authenticate('jwt-header', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	ARVRController.updateWorksheetStatus
);

// Update AR-VR User
router.post(
	'/update-attend-guide-flag',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	ARVRController.updateAtentGuideFlag
);

// logOut AR-VR User
router.post(
	'/ar-vr-logout',
	passport.authenticate('jwt-header', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	ARVRController.ARVRLogout
);

///////////////////////////////////////////////// ** Client APIS ** /////////////////////////////////////////////////

//Get Client List
router.get(
	'/get-all-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllClient
);

//Get All Child Client List ----common for home page filter dropdowns client
router.get(
	'/:parentClientId/get-all-child-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllChildClient
);

//Get Client List for admin users
router.get(
	'/:parentClientId/get-all-child-client-list-for-admin',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllChildClientForAdmin
);

//Get Child Client List for Create or edit Client
router.get(
	'/:type/:parentClientId/get-child-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getChildClient
);

//Get Child Client List for Create or edit Client
router.get(
	'/:type/:parentClientId/get-child-client-list-with-parent-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getChildClientWithParentClient
);

//Get Client with All Sub Child Client List
router.get(
	'/get-all-sub-child-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSubChildClient
);

router.get(
	'/:type/:parentClientId/get-all-sub-child-client-list-for-edit-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSubChildClientForEditUser
);

//Get All Sub Client List
router.get(
	'/:parentClientId/get-all-sub-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSubChildClientForAnalytics
);

//Get Client with  Sub Child Client List  for Create or edit Client
router.get(
	'/:type/:parentClientId/get-sub-child-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getSubChildClient
);

// Get Client by Name
router.get(
	'/get-client-by-name/:name',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getClientByName
);

// Get Client by Id
router.get(
	'/get-client-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getClientById
);

// Create Client
router.post(
	'/:type/:clientId/create-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.createClient
);

// Update Client
router.put(
	'/:type/update-client/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.updateClient
);

// get last clients list  ----common for learner groups dropdowns client
router.post(
	'/:type/get-last-client-list-by-parent-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getOnlyLastClient
);

// Get Job Role By Clients ID
router.post(
	'/:type/get-all-job-role-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAlljobRoleByClient
);

//Upload Client Avatar and return file name with path and Original File Name
router.post(
	'/upload-avatar',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAvatar([{ name: 'image', maxCount: 1 }]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.uploadAvatar
);

//Get Search Client
router.post(
	'/search/client-search',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSearchClient
);

// Get Single  Client by ClientId
router.get(
	'/:type/get-single-client-by-clientId/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getSingleClientByClientId
);

//Get All Client Account List
router.get(
	'/:type/get-all-client-account-list/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	ClientController.getAllClientAccounts
);

// Get Client by Id
router.get(
	'/:clientId/get-all-client-for-dropdowns',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getAllClientById
);

// Account Suspend
router.put(
	'/:type/account-suspend/:status',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	ClientController.supendAccount
);

// Get All sub Client and Branch Account List
router.get(
	'/:clientId/get-all-sub-client-and-branch-account-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSubClientAndBranchAccountList
);

// Get All sub Client and Branch Admin User List
router.get(
	'/:clientId/:roleId/get-all-client-and-branch-admin-user-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllSubClientAndBranchAdminUserList
);

// /////////////////////////////////////////////// ** User Controllers APIS ** /////////////////////////////////////////////////

// Genrate OTP
// router.put('/:type/otp', UserController.genarateOtp);

// Genrate PWA OTP
// router.put('/:type/pwaotp', UserController.genaratePWAOtp);

//update Admin User Token as per selected Role
router.post(
	'/update-admin-user-token-per-selected-role-client',
	passport.authenticate('jwt', { session: false }), // JWT Middleware
	UserController.updateAdminUserToken
);

//update Admin User Token as per selected Role
router.post('/logout/:site', passport.authenticate('jwt', { session: false }), UserController.logout);

// logOut Pwa User
router.post('/pwa-logout', UserController.PWALogout);

// register user name for session code learners (Spot Registration)
router.post('/register-learners-for-session-code', UserController.registerLearnerForSessionCode);

//Login User
// router.post('/:type/validate/otp', UserController.login);

//Login User
// router.post('/:type/pwa-validate/otp', UserController.pwaLogin);

//Login User
router.post('/:type/pwa-token', UserController.getPWALearnerJWTToken);

router.get(
	'/get-all-admin-user-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserController.getClientAllAdminUser
);

router.get(
	'/:clientId/get-all-admin-user-by-client-for-edit',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserController.getClientAllAdminUserForEdit
);

// Create Admin User
router.post(
	'/create-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Facilitator',
	]),
	UserController.createUser
);

// Update Admin User
router.put(
	'/update-user/:userId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Facilitator',
	]),
	UserController.updateAdminUser
);

// Delete Admin User
router.put(
	'/delete-admin-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Facilitator',
	]),
	UserController.deleteUser
);

//Add Learner as a Admin User
router.get(
	'/get-learner-data-by-learner-id-for-adminUser/:learnerId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserController.getLearnerByLearnerIdForAdminUser
);

router.get(
	'/get-single-user-data-by-user-id/:clientId/:userId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserController.getSingleUserById
);

//Search Admin User
router.post(
	'/search/admin-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserController.getAllSearchAdminUsersbyClientId
);

//get user Persanl data
router.get(
	'/get-user-personal-data',
	passport.authenticate('jwt', { session: false }),
	UserController.getUserPersonalDetails
);

// /////////////////////////////////////////////// ** Learner Controllers APIS ** /////////////////////////////////////////////////

//Create Learner User
router.post(
	'/create-learner-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.createLearner
);

//Update Learner User
router.put(
	'/update-learner-user/:learnerId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.updateLearner
);

// Delete Learner User
router.put(
	'/delete-learner-user/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.deleteLearner
);

// Create Drip Diwo Learner User
router.put(
	'/create-drip-diwo-learner-user/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.createdripdiwouser
);

// Archive Learner User
router.put(
	'/archive-learner-user/:archivestatus/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.archiveLearner
);

//Get all Learner Users By Parent Client Id
router.get(
	'/get-all-learner-user-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getClientAllLearnerUser
);

//Get all Learner Users By Parent Client Id
router.get(
	'/:clientId/get-user-group-for-learner-update/:userId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getAllUserGroupForLearnerUpdate
);

//download all Learner Users By Parent Client Id
router.get(
	'/download-all-learner-user-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.downloadAllLearnersByClient
);

// Upload Learner Excel sheet
router.post(
	'/create-learner-user-in-bulk',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadTempExcel('file'),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.getAllContentFileName
);

// Upload Learner Excel sheet
router.post(
	'/update-learner-user-in-bulk',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadTempExcel('file'),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.getAllContentFileNameForUpdateLearner
);
//Get  Search Learner
router.post(
	'/search/learner',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LearnerController.getAllSearchLearnerByClientId
);

//Check Learner Upload Details
router.get(
	'/:roleId/:userId/:clientId/learner/check-uploaded-learner-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getCheckUploadedLearnerData
);

//Check Learner Upload Details
router.get(
	'/:roleId/:userId/:clientId/learner/check-all-notification-report-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getCheckNotificationReportData
);

//Check Learner Upload Details
router.get(
	'/:roleId/:userId/:clientId/learner/download-uploaded-learner-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.downloadUploadedLearnerData
);

//Check Learner Upload Details
router.get(
	'/:roleId/:userId/:clientId/learner/download-updated-learner-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.downloadUpdateedLearnerData
);
//Get branch Client List for learner
router.get(
	'/:parentClientId/get-branch-client-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ClientController.getAllBranchClient
);

// Move Learner User
router.put(
	'/move-learner-user-update/:branchAccountId/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	LearnerController.moveLearner
);

// /////////////////////////////////////////////// ** Learner Group Controllers APIS ** /////////////////////////////////////////////////

// Create Learner User Group
router.post(
	'/create-learner-user-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.createLearnerGroup
);

// Update Learner User Group
router.put(
	'/:learnerGroupId/update-learner-user-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.updateLearnerGroup
);

// Get Learner User Group List By User Id
router.get(
	'/get-all-learner-user-group-by-user-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroupByUserId
);

// Get Learner User Group List By User Id
router.get(
	'/get-all-learner-user-group-by-user-id-for-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroupByUserIdforCampaign
);

// Get Learner User Group name List By User Id
router.get(
	'/get-all-learner-user-group-by-user-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroupNameByUserId
);

// Get Learner User Group List By User Id
router.get(
	'/get-all-learner-user-group-for-workbook-by-user-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroupForWorkbookByUserId
);

//Delete Learner User Group By User Id
router.put(
	'/:userId/delete-learner-user-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.deleteLearnerUserGroup
);

// Get one Learner User Group Details By User Id
router.get(
	'/:userId/:learnerGroupId/get-learner-user-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroup
);

router.get(
	'/:userId/:learnerGroupId/get-learner-group-details',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getLearnerGroupDetials
);

// Get Search Learner Group
router.post(
	'/search/learnerGroup-search',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getAllSearchLearnerGroupByClientId
);

//Get all Learner Users By Client Id and Job Role
router.post(
	'/get-all-learner-users-by-client-and-job-role',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getAllLearnerByClientIdAndJobRoleId
);

//OPT-IN Selected Users
router.put(
	'/opt-in-selected-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.optinSelectedUser
);

//Get  Search all Learner Users By Client Id and Job Role
router.post(
	'/search/get-search-all-learner-users-by-client-and-job-role/:searchKey',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getAllSearchLearnerByClientIdAndJobRoleId
);

//transfer learner group to another user
router.post(
	'/transefer-learner-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.transeferLearnerGroupToAnotherUser
);

//transfer learner group to another user
router.get(
	'/dowload-learner-upload-template',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.createUploadLearnerTemplate
);

//Get Custom Field by using Client id
router.get(
	'/get-custom-field-by-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Learning Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LearnerController.getCustomFieldByClientId
);

//Check Previous Learner Upload Process Status
router.get(
	'/check-previous-learner-upload-process-status',
	passport.authenticate('jwt', { session: false }),
	LearnerController.checkPreviousLearnerUploadStatus
);

///////////////////////////////////////////////// ** Asset APIS ** /////////////////////////////////////////////////

//Upload Asset and return file name with path and Original File Name
router.post(
	'/:clientId/upload-asset',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAssets([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
	]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.uploadAsset
);

//create Asset
router.post(
	'/:clientId/create-asset',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAssets([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'PDF', maxCount: 1 },
		{ name: 'WhatsappVideo', maxCount: 1 },
	]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.createAsset
);

//update Asset
router.put(
	'/:clientId/update-asset/:assetId',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadAssets([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'PDF', maxCount: 1 },
		{ name: 'WhatsappVideo', maxCount: 1 },
	]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.updateAsset
);

// Get  Asset by Asset Id
router.get(
	'/get-asset-by-asset-id/:assetId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAssetByid
);

// Get All Asset by Client Id
router.get(
	'/:clientId/get-all-asset-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllAssetByClient
);

// Get All Asset by Client Id
router.get(
	'/:clientId/get-all-asset-by-client-for-post',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllAssetByClientForPost
);

// Get All Asset by type
router.get(
	'/:clientId/get-all-asset-by-type/:type',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllAssetByType
);

// Get All Asset by type
router.get(
	'/:clientId/get-all-search-asset-by-type/:type/:searchKey',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllAssetSearchByType
);

//Delete Asset
router.put(
	'/:clientId/delete-asset',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.deleteAsset
);

// Download Asset By Asset Id
router.get(
	'/download-asset-by-asset-id/:assetId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.downLoadAsset
);

//Search Assets
router.post(
	'/search/assets',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllSearchAssetByClientId
);

// Upload Learner Excel sheet
router.post(
	'/:userId/:clientId/create-link-asset-in-bulk',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadTempExcel('file'),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllContentFileName
);

//Check Link assets Upload Details
router.get(
	'/:userId/:clientId/drip/download-link-asset-excel-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.downloadLinkAssetsData
);

//Check Link assets Upload Details
router.post('/generate-presigned-url', AssetController.generatePresignedUrl);

//Get Dwonloadable file urls from AWS 3
router.post(
	'/generate-presigned-urls-for-download',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.downloadDataFromAWSS3
);
// /////////////////////////////////////////////// ** Drip APIS ** /////////////////////////////////////////////////

// Create Drip
router.post(
	'/:clientId/create-post',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	DripController.createDrip
);

// Get Drip By Drip Id
router.get(
	'/get-drip-by-drip-id/:dripId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getpDripByDripId
);

// Update Post
router.put(
	'/:clientId/update-drip/:dripId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	DripController.updateDrip
);

// Delete Post
router.put(
	'/:clientId/delete-post',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	DripController.deleteDrip
);

// Get All Post By Client Id
router.get(
	'/:clientId/get-all-post-by-client',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllPostByClient
);

// Get All Post By Client Id For use exsting
router.get(
	'/:clientId/get-all-post-by-client-for-use-exsiting-post',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllPostByClientForUseExstingPost
);

// Get All Drip By Client Id and Template Type For use exsting
router.get(
	'/:clientId/get-all-drip-by-client-for-use-exsiting-drip/:templateType',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllDripByClientAndTemplateTypeForUseExstingDrip
);

// Get All Post By Client Id
router.get(
	'/:clientId/get-all-post-by-client-for-post',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllPostByClientForPost
);

// Get All Post By Client Id and Post Type
router.get(
	'/:clientId/get-all-post-by-client-and-post-type/:post_type',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllPostByClientAndpostType
);

// Get All Search Drip
router.post(
	'/search/drip',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllSearchDripByClientId
);

//Check Drip is used or not
router.post(
	'/check-drip-is-used-or-not',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.checkDripIsUsedOrNot
);

// Upload Drip Excel sheet
router.post(
	'/:roleId/:userId/:clientId/create-drip-in-bulk',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadTempExcel('file'),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	DripController.uploadDripsExcel
);

//Check Only on Whatsapp Upload Details
router.get(
	'/:roleId/:userId/:clientId/:type/drip/download-drip-excel-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.downloadUploadedOnlyOnWhatAppData
);

// Get All Post By Client Id and Post Type
router.get(
	'/get-all-only-whatsapp-post-by-client-for-optIn/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.getAllWhatAppPostByClientForOptIn
);

// create asset on broadside server
router.post(
	'/create-email-asset-on-broadside',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DripController.createEmailAssetOnBroadSide
);

///////////////////////////////////////////////// ** Campaign APIS ** /////////////////////////////////////////////////

//create campaign
router.post(
	'/:clientId/create-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	CampaignController.createCampaign
);

//Delete campaign
router.put(
	'/delete-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	CampaignController.deleteCampaign
);

//Paused campaign
router.put(
	'/:clientId/paused-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	CampaignController.pausedCampaign
);

//Resumed campaign
router.put(
	'/:clientId/resume-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	CampaignController.resumeCampaign
);

//update campaign
router.put(
	'/:clientId/:campaignId/update-campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	CampaignController.updateCampaign
);

//Get All Campaign By ClientId
router.get(
	'/get-all-campaign-by-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
	]),
	CampaignController.getAllCampaignByClientId
);

//Get All Campaign By ClientId
router.get(
	'/get-campaign-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
	]),
	CampaignController.getCampaignById
);

// Get Search Campaign
router.post(
	'/search/campaign',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
	]),
	CampaignController.getAllSearchCampaignByClientId
);

//////////////////////////////////////////////////// Drip Analytics API            //////////// //////////////////////////////

//Get All Campaign By ClientId for Analytics
router.get(
	'/:campaignId/get-all-drip-title-by-campaign-for-analytics',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	CampaignController.getDripCampTitleByCampaignIdForAnalytics
);

//Get All Drip for chart By ClientId for Analytics
router.get(
	'/:clientId/:months/:dripActivity/get-all-drip-activity-for-analytics',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	CampaignController.getAllDripActivityByClientIdForAnalytics
);

//Get All Drip for chart By ClientId for Analytics
router.post(
	'/update-learner-offline-task-asset-grade',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	CampaignController.updateLearnerOfflineTaskAssetGrade
);

//Get Campaign Drip Anlytics Data
router.post(
	'/get-campaign-drip-analytic-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	CampaignController.getCampaignDripData
);

router.post(
	'/get-topper-user-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	CampaignController.getTopperUserData
);

//Get Campaign Drip Anlytics Data PWA POll
router.post('/get-campaign-drip-analytic-data-for-pwa', CampaignController.getCampaignDripDataForPWA);

//transefer drip flow to another user
router.post(
	'/transefer-drip-flow-to-user',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	CampaignController.transeferDripFlowToAnotherUser
);

//Check Tags is used or not into Conversational Flow
router.post(
	'/check-reserve-tags/:clientId',
	passport.authenticate('jwt', { session: false }),
	CampaignController.checkConversationalFlowTags
);

//Test Drip Flow
router.post('/test-drip-flow', passport.authenticate('jwt', { session: false }), CampaignController.runCampaignForTest);

/////////////////////////////////////////////////////////////New Drip Analytics API //////////// //////////////////////////////
/// New Api for Drip Analytics

router.get(
	'/get-filtered-list-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getFilterListdata
);

router.post(
	'/get-drip-analytics-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getDripAnalyticsData
);

router.post(
	'/get-drip-analytics-data-by-using-campaign-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getDripAnalyticsDataByCampaignId
);

router.post(
	'/get-quiz-drip-analytics-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getDripQuizDataByUsingDripIndexAndCampaignId
);

router.post(
	'/get-spin-the-wheel-drip-analytics-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getSpinTheWheelDataByDripIndexAndCampaignId
);

router.post(
	'/get-custom-template-drip-analytics-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getCustomTemplteDataByDripIndexAndCampaignId
);

//Get Survey Report Data
router.post(
	'/get-survey-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getSurveyDripCampaignData
);

//Get Survey Uploaded Data By User
router.post(
	'/get-survey-uploaded-data-by-user-in-zip-format',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.downloadSuerveyUploadeddataByLearner
);

//Get Poll Report Data
router.post(
	'/get-poll-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getPollDripCampaignData
);

//Get Poll graph Data
router.post(
	'/get-poll-graph-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getPollGraphData
);

//Get All Data Offline Task data for Report
router.post(
	'/get-offline-task-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getOfflineTaskDataForReport
);

//Get All Data Video data for Report
router.post(
	'/get-video-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Learning Admin',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getVideoDataForReport
);

//Get All Data carousel data for Report
router.post(
	'/get-carousel-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Learning Admin',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getCarouselDataForReport
);

//Get All Data Single Image data for Report
router.post(
	'/get-single-image-report-data-by-using-campaign-id-drip-camp-index',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Learning Admin',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getSingleImageDataForReport
);

//Get All Ofline Task Data for Analytics
router.post(
	'/get-offline-task-or-survey-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getOfflineTaskOrSurveyAllDataForAnalytics
);

//Get All Data Offlline Task data for Report
router.post(
	'/get-whats-app-drip-data-for-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getAllOnlyWhatsAppDripReport
);

//analysis count
router.get(
	'/get-all-drip-anylysis-count/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getAllDripAnalyticsCountByClientId
);

//Get All Campaign By ClientId for Analytics
router.get(
	'/:clientId/get-all-campaign-and-account-list-for-analytics',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getAllCampaignForDropdownByClientIdForAnalytics
);

//Get Ticket details for Report
//analysis count
router.post(
	'/get-all-ticket-data-for-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AnalyticsController.getTicketDataForReport
);

//////////////////////////////////////////////////// Diwo Analytics API            //////////// //////////////////////////////

//Get All Diwo for chart By ClientId for Analytics
router.get(
	'/:clientId/:months/get-all-diwo-activity-for-analytics',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	SessionController.getAllDiwoActivityByClientIdForAnalytics
);

//Get All Diwo for chart By ClientId for Analytics
router.get(
	'/:clientId/get-all-session-list-by-using-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	SessionController.getAllSessionListByClientList
);

//Get All Diwo Session Card Data by Using Session Id
router.get(
	'/:sessionId/get-sesstion-data-by-using-session-id',
	// passport.authenticate('jwt', { session: false }),
	// roleAuthorization([
	// 	'Product Owner Super Admin',
	// 	'Product Owner Admin',
	// 	'Partner Super Admin',
	// 	'Partner Admin',
	// 	'Client Admin',
	// 	'Branch Admin',
	// 	'Analyst',
	// 	'Content Author',
	// 	'Business Manager',
	// 	'Facilitator',
	// ]),
	SessionController.getSessionCardDataByUsingSessionId
);

//Get Session worksheet Learner Response data
router.post(
	'/get-session-worksheet-learner-response-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	SessionController.getLearnerResponseBySessionId
);

//Get Client Vimeo Token
router.get(
	'/get-vimeo-token-by-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	SessionController.getClientVimeoTokenByClientId
);

////////////////////////////////////////////////////////////// New Diwo Anylytics ////////////////////////////////////////////////////

//analysis count
router.get(
	'/:clientId/get-all-diwo-anylysis-count',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getAllDiwoAnalyticsCountByClientId
);

router.get(
	'/get-diwo-filtered-list-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getDiwoFilterListdata
);

router.get(
	'/:type/get-diwo-filtered-assignmentIds-list-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getDiwoFilterAssignmentIdsdata
);

router.get(
	'/:clientId/get-all-diwo-modules-courses-pathway-for-analytics/:viewedBy',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getAllModuleCoursePathwaysForAnalytics
);

router.post(
	'/:clientId/get-diwo-module-data-for-analytics-by-moduleId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getModuleDataForAnalyticsByModuleId
);

router.post(
	'/:clientId/get-diwo-course-data-for-analytics-by-courseId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getCourseDataForAnalyticsByCourseId
);

router.post(
	'/:clientId/get-diwo-pathway-data-for-analytics-by-pathwayId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getPathwaysDataForAnalyticsById
);

router.post(
	'/get-diwo-analytics-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAnalyticsController.getDiwoAnalyticsData
);

//////////////////////////////////////////////////////// ** SYSTEM BRANDING ** //////////////////////////////////////////////////////

//Upload System Branding and return file name with path and Original File Name
router.post(
	'/upload-system-branding',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadSystemBranding([{ name: 'image', maxCount: 1 }]),
	roleAuthorization(['Product Owner Super Admin', 'Partner Super Admin', 'Client Admin', 'Facilitator']),
	ClientController.uploadSystemBrandingImage
);

// Create System Branding
router.post(
	'/create-system-branding/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Partner Super Admin', 'Client Admin', 'Facilitator']),
	ClientController.createSystemBranding
);

// Update System Branding
router.put(
	'/:clientId/update-system-branding/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Partner Super Admin', 'Client Admin', 'Facilitator']),
	ClientController.updateSystemBranding
);

//get Client name List Of without App Brnading
router.get(
	'/get-client-name-list-of-without-app-branding/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getClientListOfWithoutAppBranding
);

//get Client name List Of without App Brnading
router.get(
	'/:type/get-client-name-list-for-app-branding/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getClientListForAppBranding
);

// Get All System Branding List
router.get(
	'/get-all-system-branding-list-by-parent-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getAllSystemBranding
);

// Get All System Branding List
router.post(
	'/get-all-search-system-branding-list-by-parent-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getAllSearchSystemBranding
);

// Get Client App Branding
router.get(
	'/get-client-app-branding/:clientId',
	passport.authenticate('jwt', { session: false }),
	ClientController.getClientAppBranding
);

// Get  System Branding by id
router.get(
	'/:type/:clientId/get-app-branding-by-id/:appBrandingId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	ClientController.getAppBrandingById
);

// Get Branch Name for spot registration
router.get(
	'/get-branch-name-list-under-client-for-spot-registration/:clientId',
	ClientController.getAllBranchNameForSporRegistarion
);

router.get(
	'/get-appbranding-spotreg-by-sesioncode/:sessionCode',
	ClientController.getAppBrandingForSpotRegBySessionCode
);

//////////////////////////////////////////////////////////////////////////////** CUSTOM TEMPLATE **//////////////////////////////////////////////

// Create Custom Template
router.post(
	'/:clientId/create-custom-template',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	CustomeTemplateController.createCustomTemplate
);

//get TEmplate name
router.get(
	'/:clientId/get-all-custom-template-using-clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	CustomeTemplateController.getAllCustomTemplateByUsingClientId
);

//Update Custom Template
router.post(
	'/update-custom-template/:id/',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	CustomeTemplateController.updateCustomTemplate
);

//get custom template by using Client Id
router.get(
	'/:clientId/get-custom-template-by-clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	CustomeTemplateController.getCustomTemplateByClientId
);

//get custom template by using id
router.get(
	'/:tempId/get-custom-template-using-tempId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	CustomeTemplateController.getCustomTemplateByUsingTempId
);

//Delete Custom TEmplate
router.put(
	'/:clientId/delete-custom-template',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	CustomeTemplateController.deleteCustomTemplate
);

//////////////////////////////////////////////////////// ** WhatsApp Setup APIs ** //////////////////////////////////////////////////////

//Create WhatsApp Setup record
router.post(
	'/turn-off-whatsapp-default-reply-toggle/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	ClientController.disableWhatsAppDefaultReplyToggle
);

//////////////////////////////////////////////////////// ** WhatsApp Setup APIs ** //////////////////////////////////////////////////////

//Create WhatsApp Setup record
router.post(
	'/create-whatsapp-setup',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	WhatsAppSetupController.createWhatsAppSetupForClient
);

//Update WhatsApp Setup record
router.put(
	'/:clientId/update-whatsapp-setup/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	WhatsAppSetupController.updateWhatsAppSetupForClient
);

//Update WhatsApp Setup record
router.delete(
	'/delete-whatsapp-setup/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	WhatsAppSetupController.deleteWhatsAppSetup
);

//get Client name List Of without WhatsApp Setup
router.get(
	'/get-client-name-list-of-without-whatsapp-setup/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getAllClientListWithOutWhatsSetup
);

//Get Child Client List not have any WhatsApp Setup
router.get(
	'/get-child-client-list-not-have-whatsapp-setup/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getAllChildClientListWithWhatsAppSetupDetails
);

//get WhatsApp Setup by Id
router.get(
	'/get-whatsapp-setup-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getWhatsAppSetupById
);

//get All WhatsApp Setup
router.get(
	'/get-all-whatsapp-setup',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getAllWhatsAppSetup
);

//get WhatsApp Setup by ClientId
router.get(
	'/:clientId/get-whatsapp-setup-and-team-setup-by-client-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
	]),
	WhatsAppSetupController.getAllWhatsAppSetupByClientId
);

//get WhatsApp Setup by One ClientId
router.get(
	'/client-whats-app-setup-by-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Analyst',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getWhatsAppSetupByClientId
);

// Get all Search  WhatsApp Template by Client Id
router.post(
	'/search/whatsAppsetup',
	passport.authenticate('jwt', { session: false }),
	WhatsAppSetupController.getAllSearchWhatsAppSetup
);

// check Learner's Account WhatsApp Setup is exits or not
router.post(
	'/check-client-whatsapp-setup-is-present-or-not',
	passport.authenticate('jwt', { session: false }),
	WhatsAppSetupController.checkWhatsAppSetupIsPresentOrNot
);

//get WhatsApp Setup by ClientId for Whatsapp OTP
router.get(
	'/get-client-whatsapp-setup-for-otp/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Analyst',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
	]),
	WhatsAppSetupController.getClientWhatAppSetupForOTP
);

//create Whatsapp OTP Template
router.get(
	'/create-whatsapp-template-for-otp/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	WhatsAppSetupController.createWhatsAppOTPTemplate
);

// -----------------------------------------------------------********************************************
// -----------------------------------------------------------------********************************************

///////////////////////////////////////////////// ** WhatsApp Template ** /////////////////////////////////////////////////

// Get all WhatsApp Template by Client Id
router.get(
	'/get-all-whatsapp-template',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	DripController.getAllWhatsAppTemplate
);

//Check WhatsApp TemplateName
router.get(
	'/check-template-name/:clientId/:templateName',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Facilitator',
	]),
	DripController.checkTemplateName
);

// update WhatsApp Template Status
router.put('/update-whatsapp-template-status/:dripId', DripController.updateWhatsAppStatus);

// Get all Search  WhatsApp Template by Client Id
router.post(
	'/search/whatsApptemplate',
	passport.authenticate('jwt', { session: false }),
	DripController.getAllSearchWhatsAppTemplate
);

//////////////////////////////////////////////////////// ** Package License ** //////////////////////////////////////////////////////

// Get Client by Id
router.get(
	'/:clientId/get-all-client-without-License-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.geAllClientWithoutLicenseById
);

// Get  Client with license
router.get(
	'/get-all-client-with-license',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.geAllClientwithLicense
);

// Create License
router.post(
	'/create-license',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.createLicense
);

// Update License
router.post(
	'/update-license/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.updateLicense
);

// Get Edit single Client by ClientId
router.get(
	'/:clientId/get-single-client-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.getSingleClientbyClientId
);

// Suspend Client
router.delete(
	'/suspend-client/:licenseId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.suspendClientLicense
);

// Activated Suspend Client
router.delete(
	'/active-client/:licenseId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.activateSuspendedClientLicense
);

// Get Client View Subscription by ClientId
router.get(
	'/:clientId/get-client-view-subscription-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	LicenseController.getClientViewSubscriptionbyClientId
);

// Get Client Subscription by ClientId
// router.get('/:clientId/get-restrict-learner-subscription', LicenseController.getAddLearnerRestrict);

//Get  Search All License
router.post(
	'/search/license',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Facilitator',
	]),
	LicenseController.getAllSearchLicenseByClientId
);

///////////////////////////////////////////////// ** User Group APIS ** /////////////////////////////////////////////////

//create User Group
router.post(
	'/:clientId/create-user-group',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserGroupController.createUserGroup
);

//Update User Group
router.put(
	'/:clientId/update-user-group/:userGroupId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserGroupController.updateUserGroup
);

//Delete User Group
router.delete(
	'/:clientId/delete-user-group/:userGroupId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	UserGroupController.deleteUserGroup
);

////////////////////////////////////////////////////     Workbook API            //////////// //////////////////////////////

//Upload Diwo Asset and return file name with path and Original File Name
router.post(
	'/upload-diwo-asset',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadDiwoAssets([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
		{ name: 'Audio', maxCount: 1 },
	]),
	WorkbookController.uploadDiwoAsset
);

router.post(
	'/upload-extract-zip-diwo-asset',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadScormModules([{ name: 'scormPackage', maxCount: 1 }]),
	WorkbookController.uploadExtractZipDiwoAsset
);

//Convert PDF to Images
router.post(
	'/convert-pdf-to-image',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadDiwoAssets([{ name: 'PDF', maxCount: 1 }]),
	WorkbookController.convertPdfToImages
);

// Upload Worksheet Excel sheet
router.post(
	'/create-worksheet-in-bulk/:moduleType',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadTempExcel('file'),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Facilitator',
	]),
	WorkbookController.uploadBulkWorksheets
);

//move vimeo video to folder
router.get(
	'/:vimeoVideoId/move-vimeo-video-to-folder/:clientId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.moveVimeoVideoToFolder
);

//create Workbook
router.post(
	'/:clientId/create-workbook',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.createWorkbook
);

//create Scorm Workbook
router.post(
	'/:clientId/create-scorm-workbook',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.createScormWorkbook
);

//Update Workbook
router.put(
	'/:clientId/update-workbook/:workbookId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.updateWorkbook
);

//Update Scorm Workbook
router.put(
	'/:clientId/update-scorm-workbook/:workbookId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.updatScormWorkbook
);

//Get Workbook By Id
router.get(
	'/:clientId/get-workbook-by-id/:workbookId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getWorkbookById
);

//Get all Workbook By Client Id
router.get(
	'/get-all-workbook-by-client-id',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllWorkbookByClientId
);

//Delete Workbook By Id
router.put(
	'/:clientId/delete-workbook',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.deleteWorkbookById
);

//Update Workbook Assign Trainer and Pre-Assign to Learner
router.put(
	'/:clientId/assign-workbook/:workbookId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.preAssignmentWorkbook
);

//Get all Trainer By Client Id
router.get(
	'/get-all-trainer-list-by-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getTrainerListByClientId
);

//Get Workbook List By Trainer Session
router.get(
	'/:clientId/get-assigned-workbook-list',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getWorkbookListbyTrainer
);

//Get Workbook List By Session CourseId
router.get(
	'/:courseId/get-workbook-list-by-courseId',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getWorkbookListbyCourseId
);

//Search Workbook
router.post(
	'/search/workbooks',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllSearchWorkbookbyClientId
);

//Create Course
// router.post(
// 	'/:clientId/create-course',
// 	passport.authenticate('jwt', { session: false }),
// 	WorkbookController.createCourse
// );

/////////////////////////////////////////////////// New Diwo MOdules API///////////////////////////////

//Get All Modules List
router.get(
	'/get-all-diwo-modules-type-list',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllDiwoModuleTypeList
);

//get all module list by module type for creating course
router.get(
	'/:clientId/:moduleId/get-all-module-list-by-module-type',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllModuleListByModuleType
);

// Get All Certificate Module by using Module Id
router.get(
	'/get-certificate-module-by-module-id/:clientId/:moduleType',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllCertificateModuleByModuleType
);

//get all Badges and Certification List
router.get(
	'/get-all-badges-and-certifications-list',
	passport.authenticate('jwt', { session: false }),
	WorkbookController.getAllBadgesAndCertificate
);
////////////////////////////////////////////////////     Session API            //////////// //////////////////////////////

//Upload Session Photographas and return file name with path and Original File Name
router.post(
	'/upload-session-photographs/:sessionId',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadSessionPhotgraphs([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'PDF', maxCount: 1 },
		{ name: 'PPT', maxCount: 1 },
	]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Partner Super Admin',
		'Client Admin',
		'Branch Admin',
		'Facilitator',
	]),
	SessionController.uploadSessionPhotos
);

// delete Session List
router.delete(
	'/delete-session-photographs/:sessionPhotgraphId',
	passport.authenticate('jwt', { session: false }),
	SessionController.removeSessionPhotgraphs
);

//create Session
router.post(
	'/:clientId/create-session',
	passport.authenticate('jwt', { session: false }),
	SessionController.createSession
);

//Update Session
router.put(
	'/:clientId/update-session/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.updateSession
);

//start Session
router.put(
	'/start-session/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.startSession
);

// Get Session List
router.get(
	'/:clientId/get-session-list',
	passport.authenticate('jwt', { session: false }),
	SessionController.getAllSessionByClientIdAndUserId
);

// Delete Session
router.put('/delete-session', passport.authenticate('jwt', { session: false }), SessionController.deleteSession);

// Get Session Participant List
router.get(
	'/get-session-participant-list/:sessionId',
	// passport.authenticate('jwt', { session: false }),
	SessionController.listOfParticipants
);

//Change Participant workbook Access Status
router.put(
	'/change-participant-workbook-access-status/:sessionUserId/:status',
	passport.authenticate('jwt', { session: false }),
	SessionController.changeParticipantStatus
);

// Get Session by Session Id
router.get(
	'/get-session-by-id/:sessionId',
	// passport.authenticate('jwt', { session: false }),
	SessionController.getSeesionBySeesionId
);

// Get all Workbook Of Sesstion
router.get(
	'/get-worksheet-of-session-by-id/:sessionId',
	// passport.authenticate('jwt', { session: false }),
	SessionController.getWorksheetsBySeesionId
);

//Change Participant Attendance Status
router.put(
	'/change-participant-attendance-status/:sessionUserId/:status',
	passport.authenticate('jwt', { session: false }),
	SessionController.changeParticipantAttendanceStatus
);

//Change Participant Attendance Status
router.put(
	'/add-user-note-by-trainer/:sessionUserId',
	passport.authenticate('jwt', { session: false }),
	SessionController.addUserNoteByTrainer
);

//Close the Seesion
router.put(
	'/close-session-by-trainer/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.closeSession
);

//end the Seesion
router.put(
	'/end-session-by-trainer/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.endSession
);

//get Session by code
router.get('/get-session-by-code/:code', SessionController.getSessionByCode);

//check Session password
router.post('/check-session-password', SessionController.checkSesstionPassword);

//Get Session  All Users All Data
router.get(
	'/get-session-all-detail/:sessionId',
	// passport.authenticate('jwt', { session: false }),
	SessionController.getSessionAllUserData
);

//Get Session  Offline Task data
router.get(
	'/get-session-offline-task-data/:sessionId/:index',
	passport.authenticate('jwt', { session: false }),
	SessionController.getSessionOfflineData
);

//Get Session  Offline Task grade
router.post(
	'/update-offline-task-grade',
	passport.authenticate('jwt', { session: false }),
	SessionController.updateSessionOfflineTaskGrade
);
// Update Session Step
router.put(
	'/update-session-step/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.updateSessionStep
);

// Get Session Course List
router.get(
	'/:clientId/get-course-list-by-client-id',
	passport.authenticate('jwt', { session: false }),
	SessionController.getSessionCourseListbyClientId
);

// Get Session Course List
router.get(
	'/:clientId/get-course-list-by-client-id-for-workbook',
	passport.authenticate('jwt', { session: false }),
	SessionController.getCourseListFOrWorkbookCreationbyClientId
);

//Search Session
router.post(
	'/:clientId/search/sessions',
	passport.authenticate('jwt', { session: false }),
	SessionController.getAllSearchSessionbyClientId
);

// Get Trainer Session id
router.get(
	'/get-trainer-session-user-id/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.getTrainerSessionUserId
);

// Check Trainer Master Session Is available OR not
router.get(
	'/get-trainer-master-session/:workbookId',
	passport.authenticate('jwt', { session: false }),
	SessionController.getTrainerMasterSession
);

// Check Trainer Master Session Is available OR not
router.get('/get-trainer-only-session-report/:sessionId', SessionController.getTrainerOnlySessionReport);

// Get All User Details How passing in the Session
router.get(
	'/get-all-data-user-how-passed-in-this-session/:sessionId',
	SessionController.checkModulePassingStatusOfLearner
);

// Update passing Learner in the Session by using Session Id
router.get(
	'/update-passing-learner-data-by-using-session-id/:sessionId',
	passport.authenticate('jwt', { session: false }),
	SessionController.checkandUpdateModulePassingStatusOfLearner
);

// Add recorded session link by using Session Id
router.post(
	'/add-recorded-session-link',
	passport.authenticate('jwt', { session: false }),
	SessionController.recordSessionLink
);

// Add recorded session link by using Session Id
router.post(
	'/unlock-learner-quiz-reattempts',
	passport.authenticate('jwt', { session: false }),
	SessionController.unlockLearnerQuizReattempts
);

/////////////////////////////////////////////////// ** Diwo Courses ** /////////////////////////////////////////////////////

//get all diwo courses
router.get(
	'/get-all-diwo-coures-using-clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.getAllDiwoCoursesByClientId
);

//Create Course
router.post(
	'/create-diwo-course',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.createDiwoCourse
);

//Update Course
router.post(
	'/update-diwo-course',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.updateDiwoCourse
);

//Upload Diwo COurse Avatar and return file name with path and Original File Name
router.post(
	'/upload-diwo-course-avatar',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadDiwoCourseThumbnail([{ name: 'image', maxCount: 1 }]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.uploadCourseAvatar
);

router.get(
	'/:courseId/get-diwo-course-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.getDiwoCourseById
);

//Delete Custom TEmplate
router.put(
	'/:clientId/delete-diwo-courses',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.deleteCourses
);

//All Serch Diwo Course Data
router.post(
	'/search/diwocourse',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoCourseController.getAllSeachDiwoCourse
);

// /////////////////////////////////////////////// ** Diwo Pathways APIS ** /////////////////////////////////////////////////

//get all diwo courses
router.get(
	'/get-all-diwo-pathway-by-clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.getAllDiwoPathwayByClientId
);

//Create Pathways
router.post(
	'/create-diwo-pathway',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.createDiwoPathway
);

//Update Pathway
router.post(
	'/update-diwo-pathway',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.updateDiwoPathway
);

router.get(
	'/:pathwayId/get-diwo-pathway-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.getDiwoPathwayById
);

//Delete Custom TEmplate
router.put(
	'/:clientId/delete-diwo-pathway',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.deletePathway
);

// All Serch Diwo Pathway Data
router.post(
	'/:clientId/search/diwopathway',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.getAllSeachDiwoPathway
);

//Upload Diwo COurse Avatar and return file name with path and Original File Name
router.post(
	'/upload-diwo-pathway-thumbnail',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadDiwoPathwayThumbnail([{ name: 'image', maxCount: 1 }]),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.UploadDiwoPathwaysThumbnails
);

//get all diwo courses for pathways
router.get(
	'/:clientId/get-all-diwo-courses-for-pathway',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.getAllDiwoCoursesForPathways
);

//get all diwo modules for pathways by courseId
router.get(
	'/:courseId/get-diwo-module-for-pathway-by-courseId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoPathwayController.getAllDiwoModuleForPathwaysByCourseId
);

///////////////////////////////////////////////// ** Diwo Assignment APIS ** /////////////////////////////////////////////////

//get  Diwo Pathways By Using ID for assignment
router.get(
	'/:pathwayId/get-diwo-pathway-by-id-for-assignment',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getDiwoPathwayByIdForAssignment
);

//get  Diwo COurse By Using ID for assignment
router.get(
	'/:courseId/get-diwo-course-by-id-for-assignment',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getDiwoCourseByIdForAssignment
);

//get  Diwo  Asignment List
router.get(
	'/get-diwo-assignment-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getDiwoAssignmentList
);

//get  Diwo Module By Using ID for assignment
router.get(
	'/:workbookId/get-diwo-module-by-id-for-assignment',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getDiwoModuleByIdForAssignment
);

// Get Learner User Group List By User Id
router.get(
	'/get-learner-group-for-assignment',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getLearnerGroupForAssignment
);

router.post(
	'/:id/:assignType/create-diwo-assignment',
	passport.authenticate('jwt', { session: false }),
	DiwoAssignmentController.createDiwoAssignment
);

router.post(
	'/:assignmetId/:id/:assignType/update-diwo-assignment',
	passport.authenticate('jwt', { session: false }),
	DiwoAssignmentController.updateDiwoAssignment
);

router.post(
	'/upgrade-diwo-pathway-assignments',
	passport.authenticate('jwt', { session: false }),
	DiwoAssignmentController.updatePathwayAssignment
);

router.post(
	'/upgrade-diwo-course-assignments',
	passport.authenticate('jwt', { session: false }),
	DiwoAssignmentController.updateCourseAssignment
);

// Get Learner User Group List By User Id
router.get(
	'/:assignmentId/get-diwo-assignment-by-assignmentId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	DiwoAssignmentController.getDiwoAssignmentByAssignmentId
);

// Delete Diwo Assignment
router.put(
	'/delete-assignment',
	passport.authenticate('jwt', { session: false }),
	DiwoAssignmentController.deleteDiwoAssignment
);

///////////////////////////////////////////////// ** Web Controllers APIS ** /////////////////////////////////////////////////

//Get Country name By using Ip address
router.get('/get/country-name/:ip', WebController.getCountryUsingIPAdd);

// Supend OR Active User
router.put(
	'/web/users/:userId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebController.suspendUser
);

// To fetch list of menu based on the user role
router.get(
	'/users/menu/:role',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	MenuController.menu
);

// TGet Account Type By Using User Role Id
router.get(
	'/get-account-type-by-using-user-role-id/:roleId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	MenuController.getAccountTypeByRoleId
);

// To fetch permission based on the user role
router.post('/users/get-users-permissions', MenuController.getPermission);

////////////////////////////////////////////////////     Drip PWA API            //////////// //////////////////////////////

// Get one Post By Id
router.post('/get-one-drip-by-id/:dripId', PWAController.getOneDripById);

// Get one Post By Id and User Id By link click
router.post('/get-one-drip-by-id/:dripId/:userId', PWAController.getOneDripByIdAndUserIdByLinkClick);

// Get one Post By Id and UserId
router.get(
	'/get-one-drip-by-id-and-user-id/:dripId/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PWAController.getOneDripByIdAndUserId
);

//get Assigned Drip Data By using Drip_code
router.get('/get-one-drip-data-by-usin-drip-code/:drip_code', PWAController.getOneDripByDripCode);

// Get one Post By User Id
router.get(
	'/get-all-drip-by-user-id',
	passport.authenticate('jwt', { session: false }),
	// roleAuthorization(['Learner']),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PWAController.getAllDripByUserId
);

// Get search Post By User Id
router.post(
	'/get-all-drip-by-user-id-for-search',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PWAController.getAllDripByUserIdForSearch
);

// Get search Post By User Id
router.post(
	'/get-all-search-drip-by-user-id/:searchKey',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PWAController.getAllSearchDripByUserId
);

// Update Like By User Id
router.put('/update-drip-like/:dripId', PWAController.updateLikeDrip);

// Update Book mark By User Id
router.put('/update-drip-bookmark/:dripId', PWAController.updateBookmarkDrip);

////////Other Type

//Clear Form
router.put('/clear-drip-form', PWAController.clearDripForm);

//Submit USer Answer
router.put('/submit-drip-user-answer/:dripAssignedId', PWAController.submitDripUserAnswer);

//Submit Sequency Question's Answer
router.put('/submit-drip-sequency/:dripAssignedId', PWAController.dripDrapAndDropAnswer);

//Submit Drip Form
router.put('/submit-drip-form/:dripAssignedId', PWAController.submitDripAnswer);

//Submit Drip Audio File With Text
router.put('/submit-drip-audio-file/:dripAssignedId', PWAController.submitDripAudioFile);

//Submit Drip Spin The Wheel Question Id
router.put('/submit-drip-spin-wheel-assign-question/:dripAssignedId', PWAController.submitDripSpinWheelQuestionIds);

//Update Drip User Action
router.put('/update-drip-click-action/:dripAssignedId', PWAController.updateDripUserAction);

router.post(
	'/upload-learner-brief-submission',
	UploadService.uploadDripLearnerBriefFiles([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'Audio', maxCount: 1 },
	]),
	PWAController.uploadDripLearnerBriefSubmission
);

//Update WhatsApp Setup record
router.delete('/remove-uploaded-learner-brife-summision-file/:id', PWAController.removeLearnerBriefAssetFile);

// Update Learner Swip count
router.post('/update-learner-carousel-swip-count/:id/:score/:max', PWAController.updateLearnerSwipCount);

// Update Learner NOte
router.post('/update-learner-offline-task-note/:dripUserQuestionId', PWAController.updateLearnerNote);

// Update Learner NOte
router.post('/update-learner-drip-survey-note/:dripUserQuestionId', PWAController.updateSurveyNote);

//Check Video Trancoding is complate or not
router.get('/:type/check-video-transcoding-status/:videoId', PWAController.checkVideoTranscodingStatus);

//Create Drip Video Log For Perticular Video against User
// router.post('/:type/create-video-watcing-log', PWAController.createVideoWatchingLog);

//Create Video Log For Question Video
router.post('/:type/update-question-video-watching-log/:id', PWAController.updateQuestionVideoWatchingLog);

//Create Drip Video Log For Perticular Video against User
router.post('/:type/update-video-watcing-log/:id/:percentage', PWAController.updateVideoWatchingLog);

//Update Click External Link
router.post('/:type/update-click-external-link/:id', PWAController.updateClickExternalLink);

//Update Click Hyper Link
router.post('/:type/update-click-hyper-link/:id', PWAController.updateClickHyperLink);

//Update Custom Template Viewed Pages
router.post('/update-cust-template-viewed-page/:id', PWAController.updateCustomTemplatePageViewed);

//////////////////////////////////////////////////////     Diwo PWA API      //////////////////////////////////////////////

//Get Session  All Users All Data for pwa
router.get('/get-session-all-detail-for-pwa/:sessionWorksheetId', PWAController.getSessionAllUserDataForPWA);

// Get  Session By SessionCode Id
router.get(
	'/get-session-by-session-code/:sessionCode',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getSessionBySessionCode
);

// Get  Session By SessionCode Id for closed session
router.get('/check-session-status-by-session-code/:sessionCode', PWAController.checkSessionClosedBySessionCode);

// Get All Workbooks
router.get(
	'/get-all-workbook-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersAllWorkbooks
);

// Get search All Workbooks
router.post(
	'/get-all-workbook-by-user-id-for-search',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersAllWorkbooksForSearch
);

// Get search All Workbooks
router.post(
	'/get-search-all-workbook-by-user-id/:searchKey',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getSearchUsersWorkbooks
);

// Get All Worksheets By Worksbook Id
router.get(
	'/get-all-worksheet-list/:sessionUserId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersAllWorksheets
);

// Get All Workbook By SessionUserId
router.get(
	'/get-all-workbook-list/:sessionUserId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersScormWorkbook
);

// Create Scorm Data Session User Workbook
router.post(
	'/create-scorm-data-by-using-workbookid',
	passport.authenticate('jwt', { session: false }),
	PWAController.createScormSessionUserWorkbook
);

// Get All ScormData By SessionUserId & WorkbookId
router.get(
  '/get-scorm-data-by-using-workbookid',
  passport.authenticate('jwt', { session: false }),
  roleAuthorization(['Learner', 'Facilitator']),
  PWAController.getSessionUserScormData
);

// Get All Worksheets By Worksbook Id
router.get(
	'/get-all-worksheet-list-for-print/:sessionUserId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersAllWorksheetsForPrint
);

//Get All SessionWorksheet id by using SessionUserId
router.post(
	'/get-sessionworksheet-ids-by-using-sessionuserid',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getAllWorksheetIdsByUsingSessionUserId
);

//Get All SessionWorksheet id by using SessionUserId
router.post(
	'/get-worksheet-ids-by-using-workbookid',
	// passport.authenticate('jwt', { session: false }),
	// roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getAllWorksheetIdsByUsingWorkbookId
);

// Get All Question By SessionWorksheet Id
router.get(
	'/get-all-Question-list/:sessionWorksheetId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getUsersAllQuestions
);

//Submit USer Answer
router.put('/submit-user-answer/:sessionWorksheetId', PWAController.submitUserAnswer);

//Submit USer Answer
router.put('/submit-traineronly-survey-user-answer', PWAController.submitTrainerSurveyUserAnswer);

//Update Learner Note
router.put('/update-learner-note/:sessionWorksheetId', PWAController.updateUserNote);

//Update Learner Note
router.put('/update-learner-note-trainer-survey/:sessionWorksheetId', PWAController.updateTrainerSurveyUserNote);

//Update Learner Survey Note
router.put('/update-learner-survey-note/:sessionWorksheetId', PWAController.updateUserSurveyNote);

//Update Learner Offline Task Note
router.put('/update-learner-offline-task-note/:sessionWorksheetId', PWAController.updateUserOfflineTaskNote);

//Update Learner favourite
router.put('/update-learner-flag/:sessionWorksheetId', PWAController.updateDiwoLearnerFlag);

//Update Learner favourite
router.put(
	'/update-learner-bookmark/:sessionWorksheetId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.updateBookmark
);

//Clear Form
router.get('/clear-form/:sessionWorksheetId', PWAController.clearForm);

//Submit Form
router.put(
	'/submit-form/:sessionWorksheetId/:sessionUserId',
	passport.authenticate('jwt', { session: false }),
	PWAController.submitDiwoAnswer
);

//Submit Form trainer survey
router.put('/submit-form-trainer-survey/:sessionWorksheetId', PWAController.submitAnswerTrainerSurvey);

//Submit Sequency Question's Answer
router.put('/submit-sequency/:sessionWorksheetId', PWAController.drapAndDropAnswer);

//Submit Diwo Spin The Wheel Question
router.put('/submit-diwo-spin-wheel-assign-question/:sessionWorksheetId', PWAController.submitDiwoSpinWheelQuestion);

// Get workbook preview by id
router.get('/get-workbook-preview-by-id/:workbookId', PWAController.getWorkbookPreviewById);

// Get worksheet preview
router.get('/get-worksheet-Question-list/:worksheetId', PWAController.getUsersAllQuestionsForPreview);

//Upload Diwo Asset and return file name with path and Original File Name
router.post(
	'/upload-learner-submission/:sessionQuestionId/:sessionWorksheetId/:sessionUserId',
	UploadService.uploadLearnerSubmissions([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
		{ name: 'Audio', maxCount: 1 },
	]),
	PWAController.uploadLearnerSubmission
);

//delete Submitted File
router.put('/delete-submitted-file/:sessionQuestionSubmissionId', PWAController.deleteSubmittedFile);

// Get assign session worksheet mark me present
router.get(
	'/get-assign-session-worksheet/:sessioncode',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.getAssignSessionWorksheet
);

// Check user Have Acces OR Not
router.get(
	'/check-user-have-access-of-session',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.checkUserHaveSessionAccess
);

//////////////////////////////////////-------NEW PWA LMS APIS---------------///////////////////////////////

//Get all Pathway Course Wotkbook and To Do List of ILT,VBT,WBT,Work Task
router.get(
	'/get-userassign-pathway-course-todos-workbook-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getUserAssignPathwayCourseWBookListForHomePage
);

router.get(
	'/get-userassign-see-all-workbook-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getUserAssignSeeAllWBookList
);

router.get(
	'/get-userassign-see-all-todos-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getUserAssignSeeAllToDosList
);

router.get(
	'/get-userassign-all-pathway-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getUserAssignAllPathwayList
);

router.get(
	'/get-userassign-all-course-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getUserAssignAllCourseList
);

router.get(
	'/:pathwayId/:diwoAssignmentId/get-pwa-pathway-details-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Facilitator', 'Learner']),
	NewPWAController.getDiwoPWAPathwayDetailById
);

router.get(
	'/:courseId/:diwoAssignmentId/get-pwa-course-details-by-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Facilitator', 'Learner']),
	NewPWAController.getDiwoPWACourseDetailById
);

router.post(
	'/get-dependency-module-details/:SessionUserId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Facilitator', 'Learner']),
	NewPWAController.getDependencyModuleDetails
);

router.post(
	'/check-planned-session-status-by-sessionId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Facilitator', 'Learner']),
	NewPWAController.checkPlannedSessionStatusBySessionId
);

//Get all Pathway Course Wotkbook and To Do List of ILT,VBT,WBT,Work Task Count
router.get(
	'/get-workbook-course-pathway-cert-badges-count-list',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	NewPWAController.getWorkbooksCoursesPathwaysCertificatesBadgesCount
);

// convert pdf to base 64
router.post(
	'/convert-pdf-to-base64',
	passport.authenticate('jwt', { session: false }),
	PWAController.convertPdfIntoBase64
);

////////////////////////////////////////////////////////////////Cookie APIS////////////////////////////////////////////////////////////////////////

//Verify Cookies
router.post('/:type/verify-cookie/:userId', PWAController.verifyCookie);

//Add Unlisted User Cookie
router.post('/add-unlisted-user-cookie', PWAController.addUnlistedUserCookie);

//Add Unlisted User Cookie without login
router.put('/:type/add-unlisted-user-cookie-without-login', PWAController.addUnlistedUserCookieWithoutLogin);

/////////////////////////////////////////////////////////////Policy APIS////////////////////////////////////////////////////////////////////////////

//Submit Sequency Question's Answer
router.put(
	'/:type/accept-policy-by-user/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PolicyController.acceptPolicyByUser
);

//create policy
router.post(
	'/change-policy-of-all-user',
	passport.authenticate('jwt', { session: false }),
	UploadService.uploadOfferPdf([
		{ name: 'CookiePolicy_file', maxCount: 1 },
		{ name: 'TermsandConditions_file', maxCount: 1 },
		{ name: 'DataProcessingAgreement_file', maxCount: 1 },
		{ name: 'PrivacyPolicy_file', maxCount: 1 },
	]),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	PolicyController.changePolicyOfAllUser
);

// download acceptance log data
router.get(
	'/opt-ins/download-acceptance-log-data/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	PolicyController.getAcceptanceDataByClientId
);

//Get All policy Change Log
router.get(
	'/get-all-policy-logs',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	PolicyController.getAllPolicyChangeLog
);

//Get All Search policy Change Log
router.post(
	'/search/optIn',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin', 'Partner Super Admin']),
	PolicyController.getAllSearchPolicyChangeLog
);

//Get WhatsApp OPTIn Acceptance by User
router.put(
	'/:type/whatsapp-opt-in-acceptance-by-user/:flag/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	PWAController.acceptWhatsAppPotIn
);

// check user is exising or new for policy accept popup
router.get(
	'/:userId/:type/check-user-is-existing-or-new-for-policy',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	PolicyController.checkUserIsExistingOrNot
);

//////////////////////////////////////////////////////////   Support Ticket    //////////////////////////////////////////////////////////////

// To create a new support ticket
router.post(
	'/supports',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	SupportController.create
);

// To fetch support tickets by User Id
router.get(
	'/supports/:userId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	SupportController.getByUserId
);

//////////////////////////////////////////////////////////   Notifications    //////////////////////////////////////////////////////////////

// get user pop up notifcation
router.get(
	'/get-user-pop-up-notifcation',
	passport.authenticate('jwt', { session: false }),
	NotifcationController.getPopupNotification
);

// get user bell notifcation
router.get(
	'/:type/get-user-bell-notifcation',
	passport.authenticate('jwt', { session: false }),
	NotifcationController.getAllBellNotification
);

// get user bell notifcation For App
router.get(
	'/:type/get-user-bell-notifcation-for-app',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	NotifcationController.getAllBellNotification
);

// check user bell notifcation For App
router.get(
	'/check-new-notifcation',
	passport.authenticate('jwt', { session: false }),
	NotifcationController.checkBellNotification
);

router.put(
	'/:type/read-all-bell-notification',
	passport.authenticate('jwt', { session: false }),
	NotifcationController.readAllBellNotification
);

//For App
router.put(
	'/:type/read-all-bell-notification-for-app',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
		'Learner',
	]),
	NotifcationController.readAllBellNotification
);

//////////////////////////////////////////////////////////   WebHooks    //////////////////////////////////////////////////////////////
//WhatsApp--Webhook
router.post('/whats-app/delivery-status', WebhookController.saveWhatsAppDeliveryStatus);

//SendGrid--Webhook
router.post('/email/delivery-status', WebhookController.saveEmailDeliveryStatus);

//Bot-- WebHook
router.post('/whats-app/replay-status', WebhookController.whatsAppReplayStatus);

//Update WhatsApp Template Details
router.post('/whats-app/update-whatspp-template-details', WebhookController.updateWhatsAppTemplateDetails);

//Chats Data
router.get(
	'/get-all-chats-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebhookController.getAllChatsData
);

//Single User Chats  Data
router.get(
	'/:clientId/:userId/get-single-user-chats-data',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebhookController.getSingleUserChatData
);
//Get All Chats Data
router.post(
	'/:clientId/send-whatsapp-chat-reply',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebhookController.sendWhatsappChatReply
);

//Chats Mark As Read
router.get(
	'/:clientId/:chatId/whatsapp-chat-mark-as-read',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebhookController.whatsappChatMarkAsRead
);

//Chats Mark As Read
router.get('/meta/onboard/callback', WebhookController.metaCallBack);

//All Serch Chats Data
router.post(
	'/search/whatsapp-chats',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	WebhookController.getAllSeachWhatappChats
);

//meta WhatsApp Webhook
router.get('/get-meta-webhooks', WebhookController.resMetaWhatsAppWebhook);
router.post('/get-meta-webhooks', WebhookController.updateMetaWhatsAppWebhookDetails);

////////////////////////////////////////////////////////// Drip  Reports    //////////////////////////////////////////////////////////////

// get whats app delivery report
router.post(
	'/get-whats-app-delivery-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getWhatsAppDeliveryReport
);

// get Contact Wise Drip Flow report
router.post(
	'/get-contact-wise-drip-flow-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripContectWiseReport
);

// get email delivery report
router.post(
	'/get-email-delivery-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getEmailDeliveryReport
);

// get teams delivery report
router.post(
	'/get-teams-delivery-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getTeamsDeliveryReport
);

// get bot message report
router.post(
	'/get-bot-message-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getBotMessageReport
);

// get Only WhatsApp report
router.post(
	'/get-only-whats-app-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfOnlyWhatsApp
);

// get  WhatsApp with Drip report
router.post(
	'/get-whats-app-with-drip-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfWhatsAppWithDrip
);

// get  Email with Drip report
router.post(
	'/get-email-with-drip-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfEmailWithDrip
);

// get Only Email report
router.post(
	'/get-only-email-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfOnlyEmailDrip
);

// get  Email with Drip report
router.post(
	'/get-only-drip-app-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfOnlyhDripApp
);

// get whats app opt in delivery report
router.post(
	'/get-whats-app-opt-in-delivery-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getWhatsAppOptInDeliveryReport
);

// get Activity Report report
router.post(
	'/get-custom-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getCustomReport
);

// get Activity Report report
router.get(
	'/get-custom-report-name-by-clientId/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getCustomReportNameByClientId
);

// get Only Email report
router.post(
	'/get-only-teams-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfOnlyTeamsDrip
);

// get  Teams with Drip report
router.post(
	'/get-teams-with-drip-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.dripActivityReportOfTeamsWithDrip
);

////////////////////////////////////////////////////////// Diwo  Reports    //////////////////////////////////////////////////////////////

// get Activity Report report
router.post(
	'/get-activity-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getActivityReport
);

// get SCORM Interaction Report
router.post(
	'/get-scrom-interaction-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getInteractionReport
);

// get SCORM Summary Report
router.post(
	'/get-scrom-summary-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.getScormSummaryReport
);

// get Learner Performance Report
router.post(
	'/get-learner-performance-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.learnerPerformanceReport
);

// get Learner PathwayWise Report
router.post(
	'/get-pathwaywise-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.pathwayWiseReport
);

// get Learner Coursewise Report
router.post(
	'/get-coursewise-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.courseWiseReport
);

// get LearnerwisBadges & Certificates Report
router.post(
	'/get-LearnerwisBadges-Certificates-report',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	ReportController.LearnerwisBadgeCertificatesReport
);

////////////////////////////////////////////////////////Download Any File //////////////////////////////////////////////////////////////////
// Download Asset and Opt_in File
router.post('/download-file', passport.authenticate('jwt', { session: false }), ReportController.downloadFile);

// Download all Submited Asset In Zip Format
router.post(
	'/download-all-files-in-zip-format/:sessionCode',
	passport.authenticate('jwt', { session: false }),
	ReportController.downloadZipFile
);

// Download Asset and Opt_in File
router.post('/download-file-for-pwa', ReportController.downloadFile);

////////////////////////////////////////////////////////Interplay APIS///////////////////////////////////////////////////////////////

// Download Asset and Opt_in File
router.post('/inter-play-account-user', InterplayController.interplay);

///////////////////////////////////////////////////////Google O AuthorisationApis///////////////////////////////////////////////////
// GoogleOAuthorisationController
router.get('/auth/google', GoogleOAuthorisationController.loginIntoGoogle);

//Redirect URl
router.get('/session/oauth/google', GoogleOAuthorisationController.getGoogleToken);

//Get Drive Asset List By Asset Type
router.post(
	'/get-google-drive-asset-list',
	passport.authenticate('jwt', { session: false }),
	GoogleOAuthorisationController.getGoogleAssetListByType
);

//Check And Downlaod File From Google Drive
// Download Asset and Opt_in File
router.post(
	'/check-and-download-from-google-drive',
	passport.authenticate('jwt', { session: false }),
	GoogleOAuthorisationController.checkAndDownloadFileFromGoogleDrive
);

//CheckToken is avalible or not
router.get(
	'/check-access-token-is-present-or-not',
	passport.authenticate('jwt', { session: false }),
	GoogleOAuthorisationController.checkAccessTokenIsPresentOrNot
);

// logout From Google Account
router.post(
	'/logout-google-drive-account',
	passport.authenticate('jwt', { session: false }),
	GoogleOAuthorisationController.logoutGoogleAccount
);

///////////////////////////////////////////////Micro Soft Teams API's///////////////////////////////////////////////////////////////
// //Authenticate Teams
router.post(
	'/microsoft-teams/authenticate',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getAuthRedirectUrl
);

router.get('/microsoft-teams/redirect', TeamsController.getAuthToken);

//Get Team app Credential
router.get(
	'/get-microsoft-teams-credential',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	TeamsController.getMicrosoftTeamsDetails
);

//Update Team app Credential
router.post(
	'/microsoft-teams/update-app-credential',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	TeamsController.updateMicrosoftTeamsDetails
);

//Get Team User Token
router.get(
	'/get-user-microsoft-teams-tokens/:clientId',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getMicrosoftTeamsUserToken
);

//Get Team User Token
router.post(
	'/revoke-user-microsoft-teams-tokens/:id',
	passport.authenticate('jwt', { session: false }),
	TeamsController.revokeTeamSignIn
);

//////Team Setup APis////
//Get Team User Token
router.get(
	'/check-team-setup-exist',
	passport.authenticate('jwt', { session: false }),
	TeamsController.showOrNotSignInButton
);

//Get Team Setup List
router.get(
	'/get-all-team-setup-list',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getTeamSetupList
);

//Get Team Setup By Setup Id
router.get(
	'/get-teams-setup-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getTeamSetupById
);

//Update Team Setup By Setup Id
router.post(
	'/update-teams-setup-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	TeamsController.updateTeamSetupById
);

//check and get team user id
router.post(
	'/get-team-user-id-by-using-client-id',
	passport.authenticate('jwt', { session: false }),
	TeamsController.checkAndGetTeamUserIdByUsingEmail
);

//check and get team user id
router.post('/microsoft-team-sync', passport.authenticate('jwt', { session: false }), TeamsController.teamSync);

//Get Teams and Channel List
router.get(
	'/get-teams-and-channel-list',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getTeamsAndChannelDetails
);

//Sync Teams Channel Details
router.get(
	'/sync-teams-channel-details/:id',
	passport.authenticate('jwt', { session: false }),
	TeamsController.syncTeamsChannelDetails
);

//Sync file from one drive
router.get(
	'/get-all-onedrive-files-for-teams/:type',
	passport.authenticate('jwt', { session: false }),
	TeamsController.getAllOneDriveFilesForTeams
);

//Check Teams Access Token by ClientId
router.get(
	'/check-teams-access-token-by-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	TeamsController.checkTeamAccessTokenByClientId
);

////////////////////////////////////////////////////////Diwo Certification//////////////////////////////////////////////////////

//Download Diwo Learner Cretificate File
router.get('/download-learner-certificate/:LearnerAchievementId', DiwoCertificateController.downloadCertification);

router.get(
	'/get-all-learner-certification',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Learner', 'Facilitator']),
	DiwoCertificateController.getAllLearnerCertification
);

//////////////////////////////////////////////////////For Agent API/////////////////////////////////////////////////////////////////
//Create WhatsApp Setup record
router.post(
	'/create-agent',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.createAgents
);

// //Update WhatsApp Setup record
router.put(
	'/:clientId/update-agent/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.updateAgent
);

// //Update WhatsApp Setup record
router.put(
	'/delete-agent',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.deleteAgent
);

//Update WhatsApp Setup record
router.get(
	'/get-all-agents',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAllAgents
);

//Update WhatsApp Setup record
router.get(
	'/get-agent-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAgentById
);

//get Client name List Of without WhatsApp Setup
router.get(
	'/get-client-name-list-of-without-agent/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAllClientListWithOutAgent
);

//Create Custom Assistance
router.post(
	'/create-assistant-and-get-id',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.createDripCustomAssistance
);

//update Custom assistant
router.post(
	'/update-assistant',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.updateDripCustomAssistance
);

//Get Assistant details And All Version
router.post(
	'/get-assistant-details-and-all-version',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAssistantDetailsAndAllVersion
);

//Set Default assistant Version
router.post(
	'/set-default-assistant-version',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.setAssistantVersion
);

//Get Team app Credential
router.get(
	'/get-all-etl-choice/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAllETLConfigration
);

//get Client name List Of without ETL Configuration
router.get(
	'/get-client-name-list-of-without-etl-config/:clientId',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	AgentController.getAllWithoutETLConfigration
);

//Create or Update ETL credential
router.post(
	'/create-update-etl-credential',
	passport.authenticate('jwt', { session: false }),
	AgentController.createUpdateETL
);

// Get All Document By Using ClientId
router.get(
	'/get-all-document-by-using-client-id/:clientId',
	passport.authenticate('jwt', { session: false }),
	AssetController.getAllDocumentByClientId
);

//Create Document
router.post(
	'/create-document',
	UploadService.uploadDocument([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'PDF', maxCount: 1 },
		{ name: 'Audio', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
		{ name: 'Presentation', maxCount: 1 },
	]),
	passport.authenticate('jwt', { session: false }),
	AssetController.createDcument
);

//Update Document
router.post(
	'/update-document/:id',
	UploadService.uploadDocument([
		{ name: 'Image', maxCount: 1 },
		{ name: 'Video', maxCount: 1 },
		{ name: 'PDF', maxCount: 1 },
		{ name: 'Audio', maxCount: 1 },
		{ name: 'Document', maxCount: 1 },
		{ name: 'Presentation', maxCount: 1 },
	]),
	passport.authenticate('jwt', { session: false }),
	AssetController.updateDocument
);

//Delete Document
router.post('/delete-document', passport.authenticate('jwt', { session: false }), AssetController.deleteDocument);

/// Get Document Custom Field By using Client Id
router.get(
	'/get-document-custom-field/:clientId',
	passport.authenticate('jwt', { session: false }),
	AssetController.getDocumentCustomField
);

/// Get Document  Id
router.get(
	'/get-document-by-id/:id',
	passport.authenticate('jwt', { session: false }),
	AssetController.getDocumentById
);

// Get All documents by type
router.post(
	'/search/documents',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization([
		'Product Owner Super Admin',
		'Product Owner Admin',
		'Partner Super Admin',
		'Partner Admin',
		'Client Admin',
		'Branch Admin',
		'Analyst',
		'Content Author',
		'Business Manager',
		'Facilitator',
	]),
	AssetController.getAllDocumentSearchByType
);

////////////////////////////////////////////////////////////System Monitering////////////////////////////////////
// Get System details
router.post(
	'/get-system-monitor-details',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin', 'Product Owner Admin']),
	SystemMonitorController.getSystemMonitorDetails
);

// Update Notification Flag
router.post(
	'/update-system-monitor-notification-flag',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin']),
	SystemMonitorController.updateNotificationFlag
);

// Get Notification Flag
router.post(
	'/get-system-monitor-notification-flag',
	passport.authenticate('jwt', { session: false }),
	roleAuthorization(['Product Owner Super Admin']),
	SystemMonitorController.getNotificationFlag
);

////////////////////////////////////////////////////////Only For a Dev///////////////////////////////////////////////////////////////

// Download Asset and Opt_in File
router.get('/delete-bot-testing-data-for-demo/:flag/:userId', TestingDatbaseController.deleteTestingBotData);
router.get('/assign-system-brading-to-drip', DripController.assignSystemBradingToDrip);
router.get(
	'/update-tack-action-flag',
	passport.authenticate('jwt', { session: false }),
	TestingDatbaseController.updateTackActionFlage
);
router.get(
	'/updateLearnerGroupUserCount',
	passport.authenticate('jwt', { session: false }),
	LearnerController.updateLearnerGroupUserCount
);

////////////////////////////////////////////////////Only For Load Testing///////////////////////////////////////////////////////////////
router.post('/get-user-personal-data-by-using-client-id', TestingDatbaseController.getAllContactEmailAndMobileNumber);
router.post('/get-user-drip-code', TestingDatbaseController.getDripCodeByUsingCampaignIdAndIndex);

module.exports = router;
