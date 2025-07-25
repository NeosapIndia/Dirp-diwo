const {
	sequelize,
	SessionUser,
	CourseStatus,
	PathwayStatus,
	Session,
	Market,
	Country,
	Op,
	Currency,
	Client,
	User,
	Role,
	Pathway,
	Course,
	Course_workbook_mapping,
	PathwayCourseMapping,
	Workbook,
	Worksheet,
	DiwoModule,
	User_group,
	DiwoAsset,
	DiwoAssignment,
	DiwoAssignUserGroupMapping,
	DiwoModuleAssign,
	LearnerAssignment,
	Question,
	Option,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	SessionWorksheet,
	SessionQuestion,
	SessionOption,
	SessionAsset,
	UserGroupMapping,
	WorkbookTrainerMapping,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to } = require('../services/util.service');
const { actionByLearner, MCQOptionSelectedAction } = require('../services/campaign.service');
const {
	CourseCompletitionSendEmailToLearner,
	PathwayCompletitionSendEmailToLearner,
} = require('../services/mailer.service');
const { getClientAppBrandingByClientId, getDiwoClientAppBrandingByClientId } = require('../services/client.service');
let env = process.env.API_APP || 'development';
const Sequelize = require('sequelize');
const config_feature = require('../config/SiteConfig.json');
const moment = require('moment');

const updateCourseAndPathwayStatus = async function (SessionUserId) {
	try {
		console.log('-----SessionUserId------', SessionUserId);
		if (!SessionUserId) {
			console.log('-----Errorrrrrrrrrrrrrr---- SessionUserId Not Found');
			return;
		}
		let isAssignmentCertification = false;
		let eligibleForAssigmentCertification = false;
		let isCourse = false;
		let isPathway = false;
		let isCourseCompleted = false;
		let isPathwayCompleted = false;
		// Need to Find All Data By using Session User
		// 1. All SessionUser Data With Current Status
		// 2. All SessionWorksheet Data With Current Status

		//////////////////////////////////////////////////////////// Update Workbook (Module) Status//////////////////////////////////////////////
		//Query Condition For Update ModuleStatus in the SessionUSer Table
		//1. "SessionUsers"."ModuleStatus" != 'Certified'
		//2. If All recorde worksheetStatus == Completed or Certified  then SessionUsers.ModuleStatus = 'Completed'
		//3. If Some Record worksheetStatus == Completed or Certified   and Not Started or In progress the SessionUsers.ModuleStatus = 'In Progress'
		//4. If All Record worksheetStatus = Not Started then SessionUsers.ModuleStatus = 'Not Started'

		let query_for_update_session_user_module_status = `
				UPDATE "SessionUsers"
					SET "ModuleStatus" = CASE
						WHEN sub.completed_count = sub.total_count THEN 'Completed'
						WHEN sub.not_started_count = sub.total_count THEN 'Not Started'
						ELSE 'In Progress'
					END
					FROM (
						SELECT
							"SessionUserId",
							COUNT(*) AS total_count,
							COUNT(CASE WHEN "worksheetStatus" = 'Completed' OR "worksheetStatus" = 'Certified' THEN 1 END) AS completed_count,
							COUNT(CASE WHEN "worksheetStatus" = 'Not Started' THEN 1 END) AS not_started_count
						FROM "SessionWorksheets"
						WHERE "SessionUserId" = :SessionUserId
						GROUP BY "SessionUserId"
					) sub
					WHERE "SessionUsers"."id" = sub."SessionUserId"
					AND "SessionUsers".id = :SessionUserId
					AND "SessionUsers"."ModuleStatus" != 'Certified' `;

		updateSessionUserStatus = await sequelize.query(query_for_update_session_user_module_status, {
			replacements: { SessionUserId }, // Ensure the SessionUserId is passed safely
			type: sequelize.QueryTypes.UPDATE,
		});

		//////////////////////////////////////////////////////////// Update Pathway AND Course Status//////////////////////////////////////////////
		let sessioUserDetails;
		//First Find PathwayStatus Id and CourseStatus Id
		[err, sessioUserDetails] = await to(
			SessionUser.findOne({
				where: {
					id: SessionUserId,
				},
				attributes: [
					'id',
					'CourseStatusId',
					'PathwayStatusId',
					'DiwoAssignmentId',
					'ModuleStatus',
					'haveCertificate',
					'eligibleForCertification',
					'UserId',
				],
				include: [
					// { model: CourseStatus, as: 'PS' },
					// { model: PathwayStatus, as: 'CS' },
					{ model: Session, attributes: ['id', 'isAssignmentCertification'] },
				],
			})
		);
		if (err) {
			console.log('----------sessioUserDetails-----------', err);
		}

		//Check this is Pathway Assign of Course Assign
		if (!sessioUserDetails) {
			console.log('--Error Error Error----SessionUSer details Not Found');
			return;
		}

		//Check Is isAssignmentCertification or not
		if (sessioUserDetails?.Session?.isAssignmentCertification == true) {
			isAssignmentCertification = true;
			if (sessioUserDetails.eligibleForCertification == true) {
				eligibleForAssigmentCertification = true;
			}
		}

		//Check is Course Or Pathway
		if (sessioUserDetails?.PathwayStatusId) {
			isPathway = true;
		} else if (sessioUserDetails?.CourseStatusId) {
			isCourse = true;
		}

		if (sessioUserDetails?.CourseStatusId) {
			let whereCondition = {
				UserId: sessioUserDetails.UserId,
			};

			//Addde New Code

			// if (sessioUserDetails?.PathwayStatusId) {
			// 	whereCondition.PathwayStatusId = sessioUserDetails.PathwayStatusId;
			// } else if (sessioUserDetails?.CourseStatusId) {
			// 	whereCondition.CourseStatusId = sessioUserDetails.CourseStatusId;
			// }

			if (sessioUserDetails?.DiwoAssignmentId) {
				whereCondition.DiwoAssignmentId = sessioUserDetails.DiwoAssignmentId;
			}

			//Get All Module Data  with Pathway and Course Status
			[err, getAllPathwayData] = await to(
				SessionUser.findAll({
					where: whereCondition,
					attributes: [
						'id',
						'CourseStatusId',
						'PathwayStatusId',
						'ModuleStatus',
						'haveCertificate',
						'eligibleForCertification',
						'ModuleIndex',
						'ModuleDepedencyIndex',
						'ModuleOperation',
						'isAccess',
					],
					order: [['CourseStatusId', 'ASC']],
				})
			);
			if (err) {
				console.log('-----err--getAllPathwayData----', err);
			}

			let courseStatusData = [];
			if (getAllPathwayData?.length > 0) {
				//Create Update Course Status Object
				for (let data of getAllPathwayData) {
					let flag = true;
					let index = 0;
					let isCompleted = false;
					let isNotStarted = false;
					let isInProgress = false;
					let status;
					for (let _data of courseStatusData) {
						if (_data.CourseStatusId == data.CourseStatusId) {
							status = _data.status;
							flag = false;
							break;
						}
						index++;
					}
					if (flag) {
						status = data.ModuleStatus;
						let payload = {
							CourseStatusId: data.CourseStatusId,
							status: null,
						};
						courseStatusData.push(payload);
						index = courseStatusData.length - 1;
					}

					if (['Completed', 'Certified'].indexOf(data.ModuleStatus) > -1) {
						isCompleted = true;
					} else if (data.ModuleStatus == 'Not Started') {
						isNotStarted = true;
					} else {
						isInProgress = true;
					}

					//Update Status in the Array
					if (!courseStatusData[index].status) {
						if (isInProgress) {
							courseStatusData[index].status = 'In Progress';
						} else if (isCompleted) {
							courseStatusData[index].status = 'Completed';
						} else if (isNotStarted) {
							courseStatusData[index].status = 'Not Started';
						}
					} else {
						if (isCompleted && ['Completed', 'Certified'].indexOf(courseStatusData[index].status) > -1) {
							courseStatusData[index].status = 'Completed';
						} else if (isNotStarted && ['Not Started'].indexOf(courseStatusData[index].status) > -1) {
							courseStatusData[index].status = 'Not Started';
						} else {
							courseStatusData[index].status = 'In Progress';
						}
					}
				}

				//Update Course Status In the Database
				for (let courseStatus of courseStatusData) {
					let course_status = courseStatus.status;
					if (isCourse && eligibleForAssigmentCertification) {
						course_status = 'Certified';
					}

					if (course_status == 'Completed' || course_status == 'Certified') {
						isCourseCompleted = true;
					}

					[err, updateStatus] = await to(
						CourseStatus.update(
							{
								status: course_status,
							},
							{
								where: {
									id: courseStatus.CourseStatusId,
								},
							}
						)
					);
					if (err) {
						console.log('----Course--Status Update', err);
					}
				}

				//Update SessionUser isAccess flag
				let accessArray = [];
				for (let data of getAllPathwayData) {
					if (!data.isAccess && data.ModuleDepedencyIndex != 'No Dependency' && data.ModuleDepedencyIndex != null) {
						let complete = false;
						let notcomplete = false;
						let Opreation = data.ModuleOperation ? data.ModuleOperation : 'AND';
						let dependencyIndex = data.ModuleDepedencyIndex.split(',');
						if (dependencyIndex.length > 0) {
							for (let _data of getAllPathwayData) {
								if (
									dependencyIndex.indexOf(_data.ModuleIndex.toString()) > -1 ||
									(data.ModuleDepedencyIndex == 'ALL' && _data.id != data.id)
								) {
									if (_data.ModuleStatus == 'Completed' || _data.ModuleStatus == 'Certified') {
										complete = true;
									} else {
										notcomplete = true;
									}
								}
							}
						}
						if ((Opreation == 'AND' && complete && !notcomplete) || (Opreation == 'OR' && complete)) {
							accessArray.push(data.id);
						}
					}
				}

				if (accessArray.length > 0) {
					[err, updateAccessFlag] = await to(
						SessionUser.update(
							{ isAccess: true },
							{
								where: {
									id: accessArray,
								},
							}
						)
					);
					if (err) {
						console.log('----updateAccessFlag err--------', err);
					}
				}
			}

			//Check Pathway Status
			if (sessioUserDetails?.PathwayStatusId) {
				let pathwayStatus = null;
				let pathwayFlagCompleted = false;
				let pathwayFlagInProgress = false;
				let pathwayFlagNotStarted = false;
				for (let course of courseStatusData) {
					if (['In Progress'].indexOf(course.status) > -1) {
						pathwayFlagInProgress = true;
						break;
					} else if (['Not Started'].indexOf(course.status) > -1) {
						pathwayFlagNotStarted = true;
					} else {
						pathwayFlagCompleted = true;
					}
				}

				if (pathwayFlagInProgress || (pathwayFlagCompleted && pathwayFlagNotStarted)) {
					pathwayStatus = 'In Progress';
				} else if (pathwayFlagCompleted && !pathwayFlagNotStarted && !pathwayFlagInProgress) {
					pathwayStatus = 'Completed';
				} else if (!pathwayFlagInProgress && !pathwayFlagCompleted && pathwayFlagNotStarted) {
					pathwayStatus = 'Not Started';
				}

				//Check Is isAssignnmentCertification and Is User eligibleForAssigmentCertification or not
				if (isPathway && eligibleForAssigmentCertification) {
					pathwayStatus = 'Certified';
				}

				if (pathwayStatus == 'Completed' || pathwayStatus == 'Certified') {
					isPathwayCompleted = true;
				}

				//Update Pathway Status
				[err, updateStatus] = await to(
					PathwayStatus.update(
						{
							status: pathwayStatus,
						},
						{
							where: {
								id: sessioUserDetails.PathwayStatusId,
							},
						}
					)
				);
				if (err) {
					console.log('-----------------Error-- Pathway Update', err);
				}
			}
		}

		if (SessionUserId) {
			if (isCourseCompleted) {
				CourseCompletitionMailSendToLearnerNotification(SessionUserId);
				console.log('isCourseCompleted called');
			}
			if (isPathwayCompleted) {
				PathwayCompletitionMailSendToLearnerNotification(SessionUserId);
				console.log('isPathwayCompleted called');
			}

			console.log('SessionUserId in course completition fun ');
		}

		return;
	} catch (error) {
		console.log('--updateCourseAndPathwayStatus--', error);
	}
};
module.exports.updateCourseAndPathwayStatus = updateCourseAndPathwayStatus;

const CourseCompletitionMailSendToLearnerNotification = async function (SessionUserId) {
	try {
		let projectName = '';
		let type = '';

		let [err, sessioUserDetails] = await to(
			SessionUser.findOne({
				where: {
					id: SessionUserId,
				},
				include: [
					{
						model: CourseStatus,
						as: 'CS',
						where: {
							status: 'Completed',
						},
						attributes: ['id', 'status'],
					},
					{
						model: User,
						where: {
							is_deleted: false,
							cStatus: 'Active',
							forDiwo: true,
						},
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
						attributes: ['local_user_id', 'forDiwo'],
					},
				],
				attributes: ['UserId', 'ClientId', 'DiwoAssignmentId'],
			})
		);

		if (err) {
			console.log('----------sessioUserDetails-----------', err);
			return;
		}

		if (!sessioUserDetails) {
			console.error('No session user details found for ID:', SessionUserId);
			return;
		}

		sessioUserDetails = JSON.parse(JSON.stringify(sessioUserDetails));

		let Learner = sessioUserDetails.User;
		let learnerCourseStatus = sessioUserDetails?.CS?.status;

		console.log('sessioUserDetails', sessioUserDetails);

		const [err2, localUserData] = await to(
			dbInstance[Learner?.Market?.db_name]?.User_master.findOne({
				where: { id: Learner?.local_user_id },
				attributes: ['first', 'last', 'email'],
			})
		);
		if (err2) {
			console.log('Error while fetching local learner details', err2);
		}

		let userPayload = {
			first_name: localUserData?.first,
			email: localUserData?.email,
		};

		console.log('sessioUserDetails?.DiwoAssignmentId,', sessioUserDetails);

		// got the Course Title
		let [err3, diwoAssignmentDetails] = await to(
			DiwoAssignment.findOne({
				where: {
					id: sessioUserDetails?.DiwoAssignmentId,
				},
				attributes: ['CourseId'],
			})
		);
		if (err3) {
			console.log('Error while fetching diwoAssignmentDetails', err3);
		}

		console.log('diwoAssignmentDetails---01', diwoAssignmentDetails);

		diwoAssignmentDetails = JSON.parse(JSON.stringify(diwoAssignmentDetails));

		console.log('diwoAssignmentDetails---02', diwoAssignmentDetails);

		let [err4, courseDetails] = await to(
			Course.findOne({
				where: {
					id: diwoAssignmentDetails?.CourseId,
					isDeleted: false,
				},
				attributes: ['title'],
			})
		);
		if (err4) {
			console.log('Error while fetching courseDetails', err4);
		}

		courseDetails = JSON.parse(JSON.stringify(courseDetails));

		console.log('courseDetails', courseDetails);

		let emailSignatureText = '';

		console.log('sessioUserDetails.ClientId', sessioUserDetails.ClientId);
		if (Learner.forDiwo) {
			const appBrandingData = await getClientAppBrandingByClientId(sessioUserDetails.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			console.log('appBrandingData', appBrandingData);
			emailSignatureText = appBrandingData?.EmailSignatureText;
		}
		// else if (Learner.forDrip) {
		// 	const appBrandingData = await getDiwoClientAppBrandingByClientId(sessioUserDetails.ClientId);
		// 	// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
		// 	emailSignatureText = appBrandingData.EmailSignatureText;
		// }

		if (config_feature?.configurable_feature?.saas) {
			if (Learner.forDrip) {
				projectName = 'Drip';
			} else if (Learner.forDiwo) {
				projectName = 'Diwo';
			}
			type = projectName;
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		const todayDate = moment().format('MMMM DD, YYYY');

		if (learnerCourseStatus && learnerCourseStatus === 'Completed') {
			let finalPayload = {
				email: userPayload?.email,
				firstName: userPayload?.first_name,
				signature: emailSignatureText,
				projectName: projectName,
				course_name: courseDetails?.title,
				completion_date: todayDate,
			};

			console.log('finalPayload', finalPayload);
			let CourseCompletitionSendEmailToLearnerText = '';

			[err, CourseCompletitionSendEmailToLearnerText] = await to(
				CourseCompletitionSendEmailToLearner(finalPayload, type)
			);
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			// console.log('CourseCompletitionSendEmailToLearnerText', CourseCompletitionSendEmailToLearnerText)
		}
	} catch (error) {
		console.error('Unhandled error:', error);
	}
};
module.exports.CourseCompletitionMailSendToLearnerNotification = CourseCompletitionMailSendToLearnerNotification;

const PathwayCompletitionMailSendToLearnerNotification = async function (SessionUserId) {
	try {
		let projectName = '';
		let type = '';

		let [err, sessioUserDetails] = await to(
			SessionUser.findOne({
				where: {
					id: SessionUserId,
				},
				include: [
					{
						model: PathwayStatus,
						as: 'PS',
						where: {
							status: 'Completed',
						},
						attributes: ['id', 'status'],
					},
					{
						model: User,
						where: {
							is_deleted: false,
							cStatus: 'Active',
							forDiwo: true,
						},
						include: [
							{
								model: Market,
								attributes: ['db_name'],
							},
						],
						attributes: ['local_user_id', 'forDiwo'],
					},
				],
				attributes: ['UserId', 'ClientId', 'DiwoAssignmentId'],
			})
		);

		if (err) {
			console.log('----------sessioUserDetails-----------', err);
			return;
		}

		sessioUserDetails = JSON.parse(JSON.stringify(sessioUserDetails));

		let Learner = sessioUserDetails?.User;
		let learnerPathwayStatus = sessioUserDetails?.PS?.status;

		const [err2, localUserData] = await to(
			dbInstance[Learner?.Market?.db_name]?.User_master.findOne({
				where: { id: Learner?.local_user_id },
				attributes: ['first', 'last', 'email'],
			})
		);
		if (err2) {
			console.log('Error while fetching local learner details', err2);
		}

		let userPayload = {
			first_name: localUserData?.first,
			email: localUserData?.email,
		};

		// got the Course Title
		let [err3, diwoAssignmentDetails] = await to(
			DiwoAssignment.findOne({
				where: {
					id: sessioUserDetails?.DiwoAssignmentId,
				},
				attributes: ['PathwayId'],
			})
		);
		if (err3) {
			console.log('Error while fetching diwoAssignmentDetails', err3);
		}

		diwoAssignmentDetails = JSON.parse(JSON.stringify(diwoAssignmentDetails));

		// console.log('diwoAssignmentDetails', diwoAssignmentDetails);

		let [err4, pathwayDetails] = await to(
			Pathway.findOne({
				where: {
					id: diwoAssignmentDetails?.PathwayId,
					isDeleted: false,
				},
				attributes: ['title'],
			})
		);
		if (err4) {
			console.log('Error while fetching pathwayDetails', err4);
		}

		pathwayDetails = JSON.parse(JSON.stringify(pathwayDetails));

		// console.log('pathwayDetails', pathwayDetails);

		let emailSignatureText = '';

		console.log('sessioUserDetails.ClientId', sessioUserDetails.ClientId);
		if (Learner.forDiwo) {
			const appBrandingData = await getClientAppBrandingByClientId(sessioUserDetails.ClientId);
			// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
			console.log('appBrandingData', appBrandingData);
			emailSignatureText = appBrandingData.EmailSignatureText;
		}
		// else if (Learner.forDrip) {
		// 	const appBrandingData = await getDiwoClientAppBrandingByClientId(sessioUserDetails.ClientId);
		// 	// signature = `${CONFIG.image_host}${appBrandingData.signature_image_path}`;
		// 	emailSignatureText = appBrandingData.EmailSignatureText;
		// }

		if (config_feature?.configurable_feature?.saas) {
			if (Learner.forDrip) {
				projectName = 'Drip';
			} else if (Learner.forDiwo) {
				projectName = 'Diwo';
			}
			type = projectName;
		} else if (config_feature?.configurable_feature?.sles) {
			projectName = 'TASL Leap';
		}

		const todayDate = moment().format('MMMM DD, YYYY');

		if (learnerPathwayStatus === 'Completed') {
			let finalPayload = {
				email: userPayload?.email,
				firstName: userPayload?.first_name,
				signature: emailSignatureText,
				projectName: projectName,
				pathway_name: pathwayDetails?.title,
				completion_date: todayDate,
			};

			console.log('finalPayload', finalPayload);

			[err, PathwayCompletitionSendEmailToLearnerText] = await to(
				PathwayCompletitionSendEmailToLearner(finalPayload, type)
			);
			if (err) {
				console.log('--------Error in Sendgrid--------------', err);
				failed = 'e-mail';
			} else {
				success = 'e-mail';
			}

			// console.log('PathwayCompletitionSendEmailToLearnerText', PathwayCompletitionSendEmailToLearnerText)
		}
	} catch (error) {
		console.error('Unhandled error:', error);
	}
};
module.exports.PathwayCompletitionMailSendToLearnerNotification = PathwayCompletitionMailSendToLearnerNotification;
