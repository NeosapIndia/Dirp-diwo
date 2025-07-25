const {
	Op,
	System_branding,
	Session,
	SessionUser,
	SessionQuestion,
	SessionWorksheet,
	SessionOption,
	SessionAsset,
	WorkbookTrainerMapping,
	DripUserQuestion,
	DripUserOption,
	Cookie,
	User,
	DripQuestion,
	DripOption,
	CustomerPolicyLog,
	Workbook,
	Course,
	Worksheet,
	DiwoAsset,
	Question,
	Option,
	SessionQuestionSubmission,
	Market,
	User_role_client_mapping,
	CampWhatsAppEmailDrip,
	PostBriefAsset,
	UserBriefFile,
	DiwoVideoLog,
	DiwoSpinWheelCat,
	DiwoAssignment,
	Pathway,
	DiwoModule,
	LearnerAssignment,
	DiwoModuleAssign,
	PathwayCourseMapping,
	Course_workbook_mapping,
	LearnerAchievement,
	CourseStatus,
	PathwayStatus,
	sequelize,
} = require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const { actionByLearner, MCQOptionSelectedAction } = require('../services/campaign.service');

var fs = require('fs');
const MESSAGE = require('../config/message');
let imagePath = 'uploads/assets/';
const moment = require('moment');
const Sequelize = require('sequelize');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const shortid = require('shortid');
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const Joi = require('joi');
const validationConstant = require('../config/validationConstant.json');

//Get all Pathway, Course, Workbook TO Dos List for PWA HOME ILT,VBT,WBT,Work Task
const getUserAssignPathwayCourseWBookListForHomePage = async function (req, res) {
	try {
		const schema = Joi.object({
			limit: Joi.number().integer().min(1).max(4).default(4),
		});
		const { error, value } = schema.validate({
			limit: req.query.limit,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { limit } = value;

		let userId = req.user.id;
		//Seprate COurse and Pathway
		let courseList = [];
		let pathwayList = [];
		let toDosList = [];
		let allModuleList = [];
		const currentDate = moment().toDate();
		const next30Days = moment().add(30, 'days').toDate();
		// let limit = req.query.limit;
		let toDOListCount = 0;

		//  TODOs List And Module List
		[err1, condition1Result] = await to(
			SessionUser.findAll({
				where: {
					UserId: userId,
					isDeleted: false,
				},
				include: [
					{
						model: SessionAsset,
						required: true,
						attributes: ['id', 'SessionUserId', 'path', 'type', 'fileName'],
					},
					{
						model: Session,
						where: {
							[Op.or]: {
								DiwoModuleId: { [Op.eq]: 1 },
								[Op.and]: {
									DiwoModuleId: { [Op.ne]: 1 },
								},
							},
						},
						attributes: [
							'id',
							'title',
							'dateWithTime',
							'status',
							'SessionStartDate',
							'SessionEndDate',
							'step',
							'enddateWithTime',
							'DiwoModuleId',
						],
						include: [{ model: DiwoModule, attributes: ['type'] }],
						required: false,
					},
					{
						model: DiwoModuleAssign,
						include: [{ model: DiwoModule, attributes: ['type'] }],
						attributes: ['id'],
					},
				],
				attributes: [
					'id',
					'status',
					'attendanceStatus',
					'isPreAssigned',
					'title',
					'descrip',
					'expiryDate',
					'ModuleStatus',
					'isAccess',
					'ModuleDepedencyIndex',
				],
				order: [[{ model: Session }, 'enddateWithTime', 'ASC']],
			})
		);
		if (err1) return ResponseError(res, err1, 500, true);

		let All_ILT_ToDosModules = [];
		let All_30Days_VBT_WT_Modules = [];
		let All_ILT_VBT_WT_ToDosModules = [];

		let All_ILT_Modules = [];
		let All_VBT_WT_Modules = [];
		let All_ILT_VBT_WT_Modules = [];

		//Condition 1: Session = Live, ModuleId = 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();

			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}
			if ((data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') && data?.Session?.DiwoModuleId == 1) {
				All_ILT_Modules.push(data);
			}

			if (data?.Session?.status != 'Ended' && data?.Session?.status != 'Closed' && data?.Session?.DiwoModuleId == 1) {
				All_ILT_ToDosModules.push(data);
			}
		}

		//Condition 2: Session = Live, ModuleId != 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}
			if ((data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') && data?.Session?.DiwoModuleId != 1) {
				All_VBT_WT_Modules.push(data);

				if (
					// data?.Session?.enddateWithTime <= next30Days &&
					data.ModuleStatus != 'Completed' &&
					data.ModuleStatus != 'Certified'
				) {
					All_30Days_VBT_WT_Modules.push(data);
				}
			}
		}

		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}

			if (
				(data?.Session?.DiwoModuleId !== 2 &&
					data?.ModuleStatus !== 'Completed' &&
					data?.ModuleStatus !== 'Certified' &&
					data?.Session?.status !== 'Ended' &&
					data?.Session?.status !== 'Closed') ||
				(data?.Session?.DiwoModuleId === 1 &&
					data?.ModuleStatus === 'Completed' &&
					data?.ModuleStatus === 'Certified' &&
					data?.Session.status !== 'Ended' &&
					data?.Session.status !== 'Closed')
			) {
				All_ILT_VBT_WT_ToDosModules.push(data);
			}

			All_ILT_VBT_WT_Modules.push(data);
		}

		toDosList = [...All_ILT_ToDosModules, ...All_30Days_VBT_WT_Modules, ...All_ILT_VBT_WT_ToDosModules];

		// Combine all modules into one list
		allModuleList = [...All_ILT_Modules, ...All_VBT_WT_Modules, ...All_ILT_VBT_WT_Modules];

		//todos
		const uniqueToDosList = [];
		for (let i = 0; i < toDosList.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < uniqueToDosList.length; j++) {
				if (JSON.stringify(toDosList[i]) === JSON.stringify(uniqueToDosList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				uniqueToDosList.push(toDosList[i]);
			}
		}

		toDosList = [];
		const sortedToDOsList = uniqueToDosList.sort((a, b) => {
			const getDate = (m) => (m.Session?.SessionStartDate ? new Date(m.Session.SessionStartDate) : new Date(0));
			const dateA = getDate(a);
			const dateB = getDate(b);

			const isADiwo1 = a.Session?.DiwoModuleId === 1;
			const isBDiwo1 = b.Session?.DiwoModuleId === 1;

			const isADiwoOther = a.Session?.DiwoModuleId !== 1;
			const isBDiwoOther = b.Session?.DiwoModuleId !== 1;

			// Condition 1: Planned Sessions with attendanceStatus === "Present"
			const isAPlanned = a.Session?.status === 'Planned' && a.attendanceStatus === 'Present' && isADiwo1;
			const isBPlanned = b.Session?.status === 'Planned' && b.attendanceStatus === 'Present' && isBDiwo1;

			if (isAPlanned && !isBPlanned) return -1;
			if (!isAPlanned && isBPlanned) return 1;
			if (isAPlanned && isBPlanned) return b.id - a.id; // Sort Planned by latest ID

			// Condition 5: Live Sessions Ensure "Completed" and "Certified" always go to the end
			const isACompleted = (a.ModuleStatus === 'Completed' || a.ModuleStatus === 'Certified') && isADiwoOther;
			const isBCompleted = (b.ModuleStatus === 'Completed' || b.ModuleStatus === 'Certified') && isBDiwoOther;

			if (isACompleted && !isBCompleted) return 1;
			if (!isACompleted && isBCompleted) return -1;
			if (isACompleted && isBCompleted) return dateA - dateB; // Oldest first

			// Condition 2: Live Sessions
			const isALive = a.Session?.status === 'Live';
			const isBLive = b.Session?.status === 'Live';

			if (isADiwo1 && isBDiwo1 && isALive && isBLive) return dateB - dateA;
			if (isADiwo1 && isALive && !isBLive) return -1;
			if (isBDiwo1 && isBLive && !isALive) return 1;

			// Condition 3: If Session is null (Move to the start)
			if (!a.Session && !b.Session) {
				if (a.status === 'Pre Assign' && b.status !== 'Pre Assign') return -1;
				if (b.status === 'Pre Assign' && a.status !== 'Pre Assign') return 1;
				return b.id - a.id; // Sort latest created first
			}

			// Ensure null session data comes first
			if (!a.Session) return -1;
			if (!b.Session) return 1;

			// Condition 6: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId ==1
			const isAClosed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwo1;
			const isBClosed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwo1;

			if (isAClosed && !isBClosed) return -1;
			if (!isAClosed && isBClosed) return 1;
			if (isAClosed && isBClosed) return b.id - a.id; // Sort Closed by latest ID

			// Condition 7: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId !==1
			const isA1Closed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwoOther;
			const isB1Closed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwoOther;

			if (isA1Closed && !isB1Closed) return -1;
			if (!isA1Closed && isB1Closed) return 1;
			if (isA1Closed && isB1Closed) return b.id - a.id; // Sort Closed by latest ID

			// Planned Sessions with DiwoModuleId !== 1**
			const isAPlannedDiwoOther = a.Session?.status === 'Planned' && isADiwoOther;
			const isBPlannedDiwoOther = b.Session?.status === 'Planned' && isBDiwoOther;

			// if (!a.Session && isBPlannedDiwoOther) return -1; // Move Planned DiwoOther after null Session
			// if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return -1; // Move Planned DiwoOther before Live DiwoModuleId 2

			if (!a.Session && isBPlannedDiwoOther) return 1; // Move null session after Planned DiwoOther
			if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return 1; // Move Planned after Live

			if (isAPlannedDiwoOther && !isBPlannedDiwoOther) return -1;
			if (!isAPlannedDiwoOther && isBPlannedDiwoOther) return 1;
			// if (isAPlannedDiwoOther && isAPlannedDiwoOther) return b.id - a.id; // Sort Closed by latest ID
			if (isAPlannedDiwoOther && isAPlannedDiwoOther) return a.id - b.id; // Sort Closed by latest ID

			return 0;
		});

		toDOListCount = sortedToDOsList.length;
		// Apply limit after sorting
		toDosList = sortedToDOsList.slice(0, limit);

		//all module
		const uniqueList = [];
		for (let i = 0; i < allModuleList.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < uniqueList.length; j++) {
				if (JSON.stringify(allModuleList[i]) === JSON.stringify(uniqueList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				uniqueList.push(allModuleList[i]);
			}
		}

		allModuleList = [];
		const sortedModuleList = uniqueList.sort((a, b) => {
			const getDate = (m) => (m.Session?.SessionStartDate ? new Date(m.Session.SessionStartDate) : new Date(0));
			const dateA = getDate(a);
			const dateB = getDate(b);

			const isADiwo1 = a.Session?.DiwoModuleId === 1;
			const isBDiwo1 = b.Session?.DiwoModuleId === 1;

			const isADiwoOther = a.Session?.DiwoModuleId !== 1;
			const isBDiwoOther = b.Session?.DiwoModuleId !== 1;

			// Condition 1: Planned Sessions with attendanceStatus === "Present"
			const isAPlanned = a.Session?.status === 'Planned' && a.attendanceStatus === 'Present' && isADiwo1;
			const isBPlanned = b.Session?.status === 'Planned' && b.attendanceStatus === 'Present' && isBDiwo1;

			if (isAPlanned && !isBPlanned) return -1;
			if (!isAPlanned && isBPlanned) return 1;
			if (isAPlanned && isBPlanned) return b.id - a.id; // Sort Planned by latest ID

			// Condition 5: Live Sessions Ensure "Completed" and "Certified" always go to the end
			const isACompleted = (a.ModuleStatus === 'Completed' || a.ModuleStatus === 'Certified') && isADiwoOther;
			const isBCompleted = (b.ModuleStatus === 'Completed' || b.ModuleStatus === 'Certified') && isBDiwoOther;

			if (isACompleted && !isBCompleted) return 1;
			if (!isACompleted && isBCompleted) return -1;
			if (isACompleted && isBCompleted) return dateA - dateB; // Oldest first

			// Condition 2: Live Sessions
			const isALive = a.Session?.status === 'Live';
			const isBLive = b.Session?.status === 'Live';

			if (isADiwo1 && isBDiwo1 && isALive && isBLive) return dateB - dateA;
			if (isADiwo1 && isALive && !isBLive) return -1;
			if (isBDiwo1 && isBLive && !isALive) return 1;

			// Condition 3: Ended Sessions
			const isAEnded = a.Session?.status === 'Ended';
			const isBEnded = b.Session?.status === 'Ended';

			if (isADiwo1 && isBDiwo1 && isAEnded && isBEnded) return dateA - dateB; // Oldest first
			if (isADiwo1 && isAEnded && !isBEnded) return -1;
			if (isBDiwo1 && isBEnded && !isAEnded) return 1;

			// Condition 4: If Session is null (Move to the start)
			if (!a.Session && !b.Session) {
				if (a.status === 'Pre Assign' && b.status !== 'Pre Assign') return -1;
				if (b.status === 'Pre Assign' && a.status !== 'Pre Assign') return 1;
				return b.id - a.id; // Sort latest created first
			}

			// Ensure null session data comes first
			if (!a.Session) return -1;
			if (!b.Session) return 1;

			// Condition 6: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId ==1
			const isAClosed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwo1;
			const isBClosed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwo1;

			if (isAClosed && !isBClosed) return -1;
			if (!isAClosed && isBClosed) return 1;
			if (isAClosed && isBClosed) return b.id - a.id; // Sort Closed by latest ID

			// Condition 7: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId !==1
			const isA1Closed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwoOther;
			const isB1Closed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwoOther;

			if (isA1Closed && !isB1Closed) return -1;
			if (!isA1Closed && isB1Closed) return 1;
			if (isA1Closed && isB1Closed) return b.id - a.id; // Sort Closed by latest ID

			// Planned Sessions with DiwoModuleId !== 1**
			const isAPlannedDiwoOther = a.Session?.status === 'Planned' && isADiwoOther;
			const isBPlannedDiwoOther = b.Session?.status === 'Planned' && isBDiwoOther;

			// if (!a.Session && isBPlannedDiwoOther) return -1; // Move Planned DiwoOther after null Session
			// if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return -1; // Move Planned DiwoOther before Live DiwoModuleId 2

			if (!a.Session && isBPlannedDiwoOther) return 1; // Move null session after Planned DiwoOther
			if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return 1; // Move Planned after Live

			if (isAPlannedDiwoOther && !isBPlannedDiwoOther) return -1;
			if (!isAPlannedDiwoOther && isBPlannedDiwoOther) return 1;
			// if (isAPlannedDiwoOther && isAPlannedDiwoOther) return b.id - a.id; // Sort Closed by latest ID
			if (isAPlannedDiwoOther && isAPlannedDiwoOther) return a.id - b.id; // Sort Closed by latest ID

			return 0;
		});

		// Apply limit after sorting
		allModuleList = sortedModuleList.slice(0, limit);

		// For Course And Pathway List
		[err2, condition2Result] = await to(
			LearnerAssignment.findAll({
				where: {
					UserId: userId,
				},
				include: [
					{
						model: DiwoAssignment,
						attributes: ['id', 'PathwayId', 'CourseId', 'StartDate', 'EndDate', 'status', 'assignmentCopy'],
						include: [
							{
								model: Course,
								attributes: [
									'id',
									'title',
									'description',
									'avatar',
									'avatar_file_name',
									'avatar_path',
									'status',
									'totalModules',
								],
							},
							{
								model: Pathway,
								attributes: [
									'id',
									'title',
									'description',
									'avatar',
									'avatar_file_name',
									'avatar_path',
									'status',
									'totalModules',
									'totalCourses',
								],
							},
							{
								model: DiwoModuleAssign,
								include: [
									{
										model: Course,
										attributes: [
											'id',
											'title',
											'description',
											'avatar',
											'avatar_file_name',
											'avatar_path',
											'status',
											'totalModules',
										],
									},
									{
										model: SessionUser,
										where: {
											UserId: req.user.id,
										},
										attributes: ['id', 'attendanceStatus', 'isAccess', 'ModuleStatus'],
										include: [
											{
												model: PathwayStatus,
												as: 'PS',
												attributes: ['id', 'status'],
											},
											{
												model: CourseStatus,
												as: 'CS',
												attributes: ['id', 'status'],
											},
										],
									},
								],
								attributes: ['id'],
							},
						],
					},
				],
				attributes: ['id', 'StartDate', 'EndDate'],
				order: [['EndDate', 'DESC']],
			})
		);
		if (err2) return ResponseError(res, err2, 500, true);

		let notStartedPathway = [];
		let inProgressPathway = [];
		let completedPathway = [];

		let notStartedCourse = [];
		let inProgressCourse = [];
		let completedCourse = [];

		for (let data_ of condition2Result) {
			let data = data_.convertToJSON();

			if (data?.DiwoAssignment?.PathwayId != null) {
				// if (pathwayList.length < limit) {
				let status = null;
				status = data.DiwoAssignment?.DiwoModuleAssigns[0]?.SessionUsers[0]?.PS?.status;
				//Change Pathway details
				if (data?.DiwoAssignment?.assignmentCopy != null && JSON.parse(data.DiwoAssignment.assignmentCopy).Pathway) {
					data.DiwoAssignment.Pathway = JSON.parse(data.DiwoAssignment.assignmentCopy).Pathway;
				}
				let payload = {
					...data.DiwoAssignment.Pathway,
					DiwoAssignmentId: data.DiwoAssignment.id,
					pathwayStatus: status,
					DiwoModuleAssign: data.DiwoAssignment.DiwoModuleAssigns,
				};

				if (status == 'Not Started') {
					notStartedPathway.push(payload);
				} else if (status == 'In Progress') {
					inProgressPathway.push(payload);
				} else {
					completedPathway.push(payload);
				}
				// }

				if (data?.DiwoAssignment?.DiwoModuleAssigns.length > 0) {
					let courseArray = [];
					for (let item of data.DiwoAssignment.DiwoModuleAssigns) {
						if (item.Course) {
							// Check if CourseID already exists in courseList
							let isDuplicate = false;
							let i = 0;
							for (i = 0; i < courseArray.length; i++) {
								if (courseArray[i].id == item.Course.id) {
									isDuplicate = true;
									break;
								}
							}

							let course_status = null;
							course_status = item.SessionUsers[0]?.CS?.status;

							// Only push the item if it's not a duplicate
							if (isDuplicate) {
								courseArray[i].DiwoModuleAssign.push(item);
							} else {
								let payload = {
									...item.Course,
									DiwoAssignmentId: data.DiwoAssignment.id,
									courseStatus: course_status,
									DiwoModuleAssign: [item],
									totalModules: data.DiwoAssignment.Pathway.totalModules,
								};
								courseArray.push(payload);
							}
						}
					}

					if (courseArray.length > 0) {
						for (let course of courseArray) {
							if (course.courseStatus == 'Not Started') {
								notStartedCourse.push(course);
							} else if (course.courseStatus == 'In Progress') {
								inProgressCourse.push(course);
							} else {
								completedCourse.push(course);
							}
						}
					}
				}
			} else if (data?.DiwoAssignment?.CourseId != null) {
				// if (courseList.length < limit) {
				let course_status = null;
				course_status = data.DiwoAssignment?.DiwoModuleAssigns[0]?.SessionUsers[0]?.CS?.status;

				//Change Pathway details
				if (data?.DiwoAssignment?.assignmentCopy != null && JSON.parse(data.DiwoAssignment.assignmentCopy)) {
					let temp = JSON.parse(data.DiwoAssignment.assignmentCopy);
					if (temp?.Course) {
						data.DiwoAssignment.Course = temp.Course;
					} else if (temp?.Courses?.length > 0) {
						for (let course_ of temp.Courses) {
							if (course_.id == data.DiwoAssignment.Course.id) {
								data.DiwoAssignment.Course = course_;
								break;
							}
						}
					}
				}

				let payload = {
					...data.DiwoAssignment.Course,
					DiwoAssignmentId: data.DiwoAssignment.id,
					courseStatus: course_status,
					DiwoModuleAssign: data.DiwoAssignment.DiwoModuleAssigns,
					totalModules: data.DiwoAssignment.Course.totalModules,
				};

				if (course_status == 'Not Started') {
					notStartedCourse.push(payload);
				} else if (course_status == 'In Progress') {
					inProgressCourse.push(payload);
				} else {
					completedCourse.push(payload);
				}
				// }
			}
		}

		pathwayList = [...inProgressPathway, ...notStartedPathway, ...completedPathway];
		courseList = [...inProgressCourse, ...notStartedCourse, ...completedCourse];

		pathwayList = pathwayList.slice(0, limit);
		courseList = courseList.slice(0, limit);

		return ResponseSuccess(res, {
			data: { pathwayList, courseList, toDosList, toDOListCount, allModuleList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserAssignPathwayCourseWBookListForHomePage = getUserAssignPathwayCourseWBookListForHomePage;

//See All Workbooks
const getUserAssignSeeAllWBookList = async function (req, res) {
	try {
		let userId = req.user.id;
		let allModuleList = [];

		//  TODO List And Module List
		[err1, condition1Result] = await to(
			SessionUser.findAll({
				where: {
					UserId: userId,
					isDeleted: false,
				},
				include: [
					{
						model: SessionAsset,
						required: true,
						attributes: ['id', 'SessionUserId', 'path', 'type', 'fileName'],
					},
					{
						model: Session,
						required: true,
						attributes: [
							'id',
							'title',
							'dateWithTime',
							'status',
							'SessionStartDate',
							'SessionEndDate',
							'step',
							'enddateWithTime',
							'DiwoModuleId',
						],
						include: [{ model: DiwoModule, attributes: ['type'] }],
						required: false,
					},
					{
						model: DiwoModuleAssign,
						include: [{ model: DiwoModule, attributes: ['type'] }],
					},
				],
				attributes: [
					'id',
					'status',
					'attendanceStatus',
					'isPreAssigned',
					'title',
					'descrip',
					'expiryDate',
					'ModuleStatus',
					'isAccess',
					'ModuleDepedencyIndex',
				],
				order: [[{ model: Session }, 'enddateWithTime', 'ASC']],
			})
		);
		if (err1) return ResponseError(res, err1, 500, true);

		let All_ILT_Modules = [];
		let All_VBT_WT_Modules = [];
		let All_ILT_VBT_WT_Modules = [];

		//Condition 1: Session = Live, ModuleId = 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();

			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}
			if ((data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') && data?.Session?.DiwoModuleId == 1) {
				All_ILT_Modules.push(data);
			}
		}

		//Condition 2: Session = Live, ModuleId != 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}

			if ((data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') && data?.Session?.DiwoModuleId != 1) {
				All_VBT_WT_Modules.push(data);
			}
		}

		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}

			All_ILT_VBT_WT_Modules.push(data);
		}

		// Combine all modules into one list
		allModuleList = [...All_ILT_Modules, ...All_VBT_WT_Modules, ...All_ILT_VBT_WT_Modules];

		//all module
		const uniqueList = [];
		for (let i = 0; i < allModuleList.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < uniqueList.length; j++) {
				if (JSON.stringify(allModuleList[i]) === JSON.stringify(uniqueList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				uniqueList.push(allModuleList[i]);
			}
		}
		allModuleList = [];
		allModuleList = uniqueList.sort((a, b) => {
			const getDate = (m) => (m.Session?.SessionStartDate ? new Date(m.Session.SessionStartDate) : new Date(0));
			const dateA = getDate(a);
			const dateB = getDate(b);

			const isADiwo1 = a.Session?.DiwoModuleId === 1;
			const isBDiwo1 = b.Session?.DiwoModuleId === 1;

			const isADiwoOther = a.Session?.DiwoModuleId !== 1;
			const isBDiwoOther = b.Session?.DiwoModuleId !== 1;

			// Condition 1: Planned Sessions with attendanceStatus === "Present"
			const isAPlanned = a.Session?.status === 'Planned' && a.attendanceStatus === 'Present' && isADiwo1;
			const isBPlanned = b.Session?.status === 'Planned' && b.attendanceStatus === 'Present' && isBDiwo1;

			if (isAPlanned && !isBPlanned) return -1;
			if (!isAPlanned && isBPlanned) return 1;
			if (isAPlanned && isBPlanned) return b.id - a.id; // Sort Planned by latest ID

			// Condition 5: Live Sessions Ensure "Completed" and "Certified" always go to the end
			const isACompleted = (a.ModuleStatus === 'Completed' || a.ModuleStatus === 'Certified') && isADiwoOther;
			const isBCompleted = (b.ModuleStatus === 'Completed' || b.ModuleStatus === 'Certified') && isBDiwoOther;

			if (isACompleted && !isBCompleted) return 1;
			if (!isACompleted && isBCompleted) return -1;
			if (isACompleted && isBCompleted) return dateA - dateB; // Oldest first

			// Condition 2: Live Sessions
			const isALive = a.Session?.status === 'Live';
			const isBLive = b.Session?.status === 'Live';

			if (isADiwo1 && isBDiwo1 && isALive && isBLive) return dateB - dateA;
			if (isADiwo1 && isALive && !isBLive) return -1;
			if (isBDiwo1 && isBLive && !isALive) return 1;

			// Condition 3: Ended Sessions
			const isAEnded = a.Session?.status === 'Ended';
			const isBEnded = b.Session?.status === 'Ended';

			if (isADiwo1 && isBDiwo1 && isAEnded && isBEnded) return dateA - dateB; // Oldest first
			if (isADiwo1 && isAEnded && !isBEnded) return -1;
			if (isBDiwo1 && isBEnded && !isAEnded) return 1;

			// Condition 4: If Session is null (Move to the start)
			if (!a.Session && !b.Session) {
				if (a.status === 'Pre Assign' && b.status !== 'Pre Assign') return -1;
				if (b.status === 'Pre Assign' && a.status !== 'Pre Assign') return 1;
				return b.id - a.id; // Sort latest created first
			}

			// Ensure null session data comes first
			if (!a.Session) return -1;
			if (!b.Session) return 1;

			// Condition 6: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId ==1
			const isAClosed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwo1;
			const isBClosed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwo1;

			if (isAClosed && !isBClosed) return -1;
			if (!isAClosed && isBClosed) return 1;
			if (isAClosed && isBClosed) return b.id - a.id; // Sort Closed by latest ID

			// Condition 7: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId !==1
			const isA1Closed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwoOther;
			const isB1Closed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwoOther;

			if (isA1Closed && !isB1Closed) return -1;
			if (!isA1Closed && isB1Closed) return 1;
			if (isA1Closed && isB1Closed) return b.id - a.id; // Sort Closed by latest ID

			// Planned Sessions with DiwoModuleId !== 1**
			const isAPlannedDiwoOther = a.Session?.status === 'Planned' && isADiwoOther;
			const isBPlannedDiwoOther = b.Session?.status === 'Planned' && isBDiwoOther;

			// if (!a.Session && isBPlannedDiwoOther) return -1; // Move Planned DiwoOther after null Session
			// if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return -1; // Move Planned DiwoOther before Live DiwoModuleId 2

			if (!a.Session && isBPlannedDiwoOther) return 1; // Move null session after Planned DiwoOther
			if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return 1; // Move Planned after Live

			if (isAPlannedDiwoOther && !isBPlannedDiwoOther) return -1;
			if (!isAPlannedDiwoOther && isBPlannedDiwoOther) return 1;
			// if (isAPlannedDiwoOther && isAPlannedDiwoOther) return b.id - a.id; // Sort Closed by latest ID
			if (isAPlannedDiwoOther && isAPlannedDiwoOther) return a.id - b.id; // Sort Closed by latest ID

			return 0;
		});

		return ResponseSuccess(res, {
			data: { allModuleList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserAssignSeeAllWBookList = getUserAssignSeeAllWBookList;

//See All TOdos Page
const getUserAssignSeeAllToDosList = async function (req, res) {
	try {
		let userId = req.user.id;
		//Seprate COurse and Pathway
		let courseList = [];
		let pathwayList = [];
		let toDosList = [];
		let allModuleList = [];
		const currentDate = moment().toDate();
		const next30Days = moment().add(30, 'days').toDate();
		let limit = req.query.limit;

		//  TODOs List And Module List
		[err1, condition1Result] = await to(
			SessionUser.findAll({
				where: {
					UserId: userId,
					isDeleted: false,
				},
				include: [
					{
						model: SessionAsset,
						required: true,
						attributes: ['id', 'SessionUserId', 'path', 'type', 'fileName'],
					},
					{
						model: Session,
						where: {
							[Op.or]: {
								DiwoModuleId: { [Op.eq]: 1 },
								[Op.and]: {
									DiwoModuleId: { [Op.ne]: 1 },
								},
							},
						},
						attributes: [
							'id',
							'title',
							'dateWithTime',
							'status',
							'SessionStartDate',
							'SessionEndDate',
							'step',
							'enddateWithTime',
							'DiwoModuleId',
						],
						include: [{ model: DiwoModule, attributes: ['type'] }],
						required: false,
					},
					{
						model: DiwoModuleAssign,
						include: [{ model: DiwoModule, attributes: ['type'] }],
						attributes: ['id'],
					},
				],
				attributes: [
					'id',
					'status',
					'attendanceStatus',
					'isPreAssigned',
					'title',
					'descrip',
					'expiryDate',
					'ModuleStatus',
					'isAccess',
					'ModuleDepedencyIndex',
				],
				order: [[{ model: Session }, 'enddateWithTime', 'ASC']],
			})
		);
		if (err1) return ResponseError(res, err1, 500, true);

		let All_ILT_ToDosModules = [];
		let All_30Days_VBT_WT_Modules = [];
		let All_ILT_VBT_WT_ToDosModules = [];

		//Condition 1: Session = Live, ModuleId = 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();

			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}
			if (
				(data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') &&
				data?.Session?.status != 'Ended' &&
				data?.Session?.status != 'Closed' &&
				data?.Session?.DiwoModuleId == 1
			) {
				All_ILT_ToDosModules.push(data);
			}
		}

		//Condition 2: Session = Live, ModuleId != 1 (ILT)
		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}
			if (
				(data?.Session?.status == 'Live' || data?.Session?.status == 'Planned') &&
				data?.Session?.status != 'Ended' &&
				data?.Session?.status != 'Closed' &&
				data?.Session?.DiwoModuleId != 1
			) {
				if (
					// data?.Session?.enddateWithTime <= next30Days &&
					data.ModuleStatus != 'Completed' &&
					data.ModuleStatus != 'Certified'
				) {
					All_30Days_VBT_WT_Modules.push(data);
				}
			}
		}

		for (let data_ of condition1Result) {
			let data = data_.convertToJSON();
			if (data.Session && data.Session.DiwoModule && data.Session.DiwoModule.type) {
				data.ModuleTypeName = data.Session.DiwoModule.type;
				delete data.Session.DiwoModule;
			} else {
				if (data.DiwoModuleAssign && data.DiwoModuleAssign.DiwoModule && data.DiwoModuleAssign.DiwoModule.type) {
					data.ModuleTypeName = data.DiwoModuleAssign.DiwoModule.type;
					delete data.DiwoModuleAssign.DiwoModule;
				} else {
					data.ModuleTypeName = 'Instructor Led Training';
				}
			}

			if (
				(data?.Session?.DiwoModuleId !== 2 &&
					data?.ModuleStatus !== 'Completed' &&
					data?.ModuleStatus !== 'Certified' &&
					data?.Session?.status !== 'Ended' &&
					data?.Session?.status !== 'Closed') ||
				(data?.Session?.DiwoModuleId === 1 &&
					data?.ModuleStatus === 'Completed' &&
					data?.ModuleStatus === 'Certified' &&
					data?.Session.status !== 'Ended' &&
					data?.Session.status !== 'Closed')
			) {
				All_ILT_VBT_WT_ToDosModules.push(data);
			}
		}

		toDosList = [...All_ILT_ToDosModules, ...All_30Days_VBT_WT_Modules, ...All_ILT_VBT_WT_ToDosModules];

		//todos
		const uniqueToDosList = [];
		for (let i = 0; i < toDosList.length; i++) {
			let isDuplicate = false;
			for (let j = 0; j < uniqueToDosList.length; j++) {
				if (JSON.stringify(toDosList[i]) === JSON.stringify(uniqueToDosList[j])) {
					isDuplicate = true;
					break;
				}
			}
			if (!isDuplicate) {
				uniqueToDosList.push(toDosList[i]);
			}
		}

		toDosList = [];
		const sortedToDOsList = uniqueToDosList.sort((a, b) => {
			const getDate = (m) => (m.Session?.SessionStartDate ? new Date(m.Session.SessionStartDate) : new Date(0));
			const dateA = getDate(a);
			const dateB = getDate(b);

			const isADiwo1 = a.Session?.DiwoModuleId === 1;
			const isBDiwo1 = b.Session?.DiwoModuleId === 1;

			const isADiwoOther = a.Session?.DiwoModuleId !== 1;
			const isBDiwoOther = b.Session?.DiwoModuleId !== 1;

			// Condition 1: Planned Sessions with attendanceStatus === "Present"
			const isAPlanned = a.Session?.status === 'Planned' && a.attendanceStatus === 'Present' && isADiwo1;
			const isBPlanned = b.Session?.status === 'Planned' && b.attendanceStatus === 'Present' && isBDiwo1;

			if (isAPlanned && !isBPlanned) return -1;
			if (!isAPlanned && isBPlanned) return 1;
			if (isAPlanned && isBPlanned) return b.id - a.id; // Sort Planned by latest ID

			// Condition 5: Live Sessions Ensure "Completed" and "Certified" always go to the end
			const isACompleted = (a.ModuleStatus === 'Completed' || a.ModuleStatus === 'Certified') && isADiwoOther;
			const isBCompleted = (b.ModuleStatus === 'Completed' || b.ModuleStatus === 'Certified') && isBDiwoOther;

			if (isACompleted && !isBCompleted) return 1;
			if (!isACompleted && isBCompleted) return -1;
			if (isACompleted && isBCompleted) return dateA - dateB; // Oldest first

			// Condition 2: Live Sessions
			const isALive = a.Session?.status === 'Live';
			const isBLive = b.Session?.status === 'Live';

			if (isADiwo1 && isBDiwo1 && isALive && isBLive) return dateB - dateA;
			if (isADiwo1 && isALive && !isBLive) return -1;
			if (isBDiwo1 && isBLive && !isALive) return 1;

			// Condition 3: If Session is null (Move to the start)
			if (!a.Session && !b.Session) {
				if (a.status === 'Pre Assign' && b.status !== 'Pre Assign') return -1;
				if (b.status === 'Pre Assign' && a.status !== 'Pre Assign') return 1;
				return b.id - a.id; // Sort latest created first
			}

			// Ensure null session data comes first
			if (!a.Session) return -1;
			if (!b.Session) return 1;

			// Condition 6: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId ==1
			const isAClosed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwo1;
			const isBClosed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwo1;

			if (isAClosed && !isBClosed) return -1;
			if (!isAClosed && isBClosed) return 1;
			if (isAClosed && isBClosed) return b.id - a.id; // Sort Closed by latest ID

			// Condition 7: CLosed Sessions with Module Status === "ModuleStatus" and DiwoModuleId !==1
			const isA1Closed = a.Session?.status === 'Closed' && a.ModuleStatus === 'Not Started' && isADiwoOther;
			const isB1Closed = b.Session?.status === 'Closed' && b.ModuleStatus === 'Not Started' && isBDiwoOther;

			if (isA1Closed && !isB1Closed) return -1;
			if (!isA1Closed && isB1Closed) return 1;
			if (isA1Closed && isB1Closed) return b.id - a.id; // Sort Closed by latest ID

			// Planned Sessions with DiwoModuleId !== 1**
			const isAPlannedDiwoOther = a.Session?.status === 'Planned' && isADiwoOther;
			const isBPlannedDiwoOther = b.Session?.status === 'Planned' && isBDiwoOther;

			// if (!a.Session && isBPlannedDiwoOther) return -1; // Move Planned DiwoOther after null Session
			// if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return -1; // Move Planned DiwoOther before Live DiwoModuleId 2

			if (!a.Session && isBPlannedDiwoOther) return 1; // Move null session after Planned DiwoOther
			if (isAPlannedDiwoOther && b.Session?.status === 'Live' && b.Session?.DiwoModuleId === 2) return 1; // Move Planned after Live

			if (isAPlannedDiwoOther && !isBPlannedDiwoOther) return -1;
			if (!isAPlannedDiwoOther && isBPlannedDiwoOther) return 1;
			// if (isAPlannedDiwoOther && isAPlannedDiwoOther) return b.id - a.id; // Sort Closed by latest ID.
			if (isAPlannedDiwoOther && isAPlannedDiwoOther) return a.id - b.id; // Sort Closed by latest ID

			return 0;
		});

		// Apply limit after sorting
		toDosList = sortedToDOsList.slice(0, limit);

		return ResponseSuccess(res, {
			data: { toDosList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserAssignSeeAllToDosList = getUserAssignSeeAllToDosList;

//Get all Pathway for ILT,VBT,WBT,Work Task
const getUserAssignAllPathwayList = async function (req, res) {
	try {
		let userId = req.user.id;
		let pathwayList = [];

		let notStartedPathway = [];
		let inProgressPathway = [];
		let completedPathway = [];

		//Pathway List
		[err2, condition2Result] = await to(
			LearnerAssignment.findAll({
				where: {
					UserId: userId,
				},
				include: [
					{
						model: DiwoAssignment,
						attributes: ['id', 'PathwayId', 'CourseId', 'StartDate', 'EndDate', 'status', 'assignmentCopy'],
						include: [
							{
								model: Pathway,
								attributes: [
									'id',
									'title',
									'description',
									'avatar',
									'avatar_file_name',
									'avatar_path',
									'status',
									'totalModules',
									'totalCourses',
								],
							},
							{
								model: DiwoModuleAssign,
								include: [
									{
										model: Course,
										attributes: [
											'id',
											'title',
											'description',
											'avatar',
											'avatar_file_name',
											'avatar_path',
											'status',
											'totalModules',
										],
									},
									{
										model: SessionUser,
										where: {
											UserId: req.user.id,
										},
										attributes: ['id', 'attendanceStatus'],
										include: [
											{
												model: PathwayStatus,
												as: 'PS',
												attributes: ['id', 'status'],
											},

											{
												model: CourseStatus,
												as: 'CS',
												attributes: ['id', 'status'],
											},
										],
									},
								],
								attributes: ['id'],
							},
						],
					},
				],
				attributes: ['id', 'StartDate', 'EndDate'],
				order: [['EndDate', 'DESC']],
			})
		);
		if (err2) return ResponseError(res, err2, 500, true);

		for (let data_ of condition2Result) {
			let data = data_.convertToJSON();

			if (data?.DiwoAssignment?.PathwayId != null) {
				let status = null;
				status = data.DiwoAssignment?.DiwoModuleAssigns[0]?.SessionUsers[0]?.PS?.status;

				//Change Pathway details
				if (data?.DiwoAssignment?.assignmentCopy != null && JSON.parse(data.DiwoAssignment.assignmentCopy).Pathway) {
					data.DiwoAssignment.Pathway = JSON.parse(data.DiwoAssignment.assignmentCopy).Pathway;
				}

				let payload = {
					...data.DiwoAssignment.Pathway,
					DiwoAssignmentId: data.DiwoAssignment.id,
					pathwayStatus: status,
					DiwoModuleAssign: data.DiwoAssignment.DiwoModuleAssigns,
				};

				if (status == 'Not Started') {
					notStartedPathway.push(payload);
				} else if (status == 'In Progress') {
					inProgressPathway.push(payload);
				} else {
					completedPathway.push(payload);
				}
			}
		}

		pathwayList = [...inProgressPathway, ...notStartedPathway, ...completedPathway];

		return ResponseSuccess(res, {
			data: { pathwayList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserAssignAllPathwayList = getUserAssignAllPathwayList;

//Get all Course for ILT,VBT,WBT,Work Task
const getUserAssignAllCourseList = async function (req, res) {
	try {
		let userId = req.user.id;
		let courseList = [];

		let notStartedCourse = [];
		let inProgressCourse = [];
		let completedCourse = [];

		// For Course List
		[err2, condition2Result] = await to(
			LearnerAssignment.findAll({
				where: {
					UserId: userId,
				},
				include: [
					{
						model: DiwoAssignment,
						attributes: ['id', 'PathwayId', 'CourseId', 'StartDate', 'EndDate', 'status'],
						include: [
							{
								model: Course,
								attributes: [
									'id',
									'title',
									'description',
									'avatar',
									'avatar_file_name',
									'avatar_path',
									'status',
									'totalModules',
								],
							},
							{
								model: Pathway,
								attributes: [
									'id',
									'title',
									'description',
									'avatar',
									'avatar_file_name',
									'avatar_path',
									'status',
									'totalModules',
									'totalCourses',
								],
							},
							{
								model: DiwoModuleAssign,
								include: [
									{
										model: Course,
										attributes: [
											'id',
											'title',
											'description',
											'avatar',
											'avatar_file_name',
											'avatar_path',
											'status',
											'totalModules',
										],
									},
									{
										model: SessionUser,
										where: {
											UserId: req.user.id,
										},
										attributes: ['id', 'attendanceStatus', 'ModuleStatus'],
										include: [
											{
												model: CourseStatus,
												as: 'CS',
												attributes: ['id', 'status'],
											},
										],
									},
								],
								attributes: ['id'],
							},
						],
					},
				],
				attributes: ['id', 'StartDate', 'EndDate'],
				order: [['EndDate', 'DESC']],
			})
		);
		if (err2) return ResponseError(res, err2, 500, true);

		for (let data_ of condition2Result) {
			let data = data_.convertToJSON();
			if (data?.DiwoAssignment?.PathwayId != null) {
				if (data?.DiwoAssignment?.DiwoModuleAssigns.length > 0) {
					let courseArray = [];
					for (let item of data.DiwoAssignment.DiwoModuleAssigns) {
						if (item.Course) {
							// Check if CourseID already exists in courseList
							let isDuplicate = false;
							let i = 0;
							for (i = 0; i < courseArray.length; i++) {
								if (courseArray[i].id == item.Course.id) {
									isDuplicate = true;
									break;
								}
							}
							// for (let course of notStartedCourse) {
							// 	if (course.id === item.Course.id) {
							// 		isDuplicate = true;
							// 		break;
							// 	}
							// }

							// for (let course of inProgressCourse) {
							// 	if (course.id === item.Course.id) {
							// 		isDuplicate = true;
							// 		break;
							// 	}
							// }

							// for (let course of completedCourse) {
							// 	if (course.id === item.Course.id) {
							// 		isDuplicate = true;
							// 		break;
							// 	}
							// }

							let course_status = null;
							course_status = item.SessionUsers[0]?.CS?.status;

							// Only push the item if it's not a duplicate
							if (isDuplicate) {
								courseArray[i].DiwoModuleAssign.push(item);
							} else {
								let payload = {
									...item.Course,
									DiwoAssignmentId: data.DiwoAssignment.id,
									courseStatus: course_status,
									DiwoModuleAssign: [item],
									totalModules: data.DiwoAssignment.Pathway.totalModules,
								};
								courseArray.push(payload);
							}
						}
					}

					if (courseArray.length > 0) {
						for (let course of courseArray) {
							if (course.courseStatus == 'Not Started') {
								notStartedCourse.push(course);
							} else if (course.courseStatus == 'In Progress') {
								inProgressCourse.push(course);
							} else {
								completedCourse.push(course);
							}
						}
					}
				}
			} else if (data?.DiwoAssignment?.CourseId != null) {
				let course_status = null;
				course_status = data.DiwoAssignment?.DiwoModuleAssigns[0]?.SessionUsers[0]?.CS?.status;
				let payload = {
					...data.DiwoAssignment.Course,
					DiwoAssignmentId: data.DiwoAssignment.id,
					courseStatus: course_status,
					DiwoModuleAssign: data.DiwoAssignment.DiwoModuleAssigns,
					totalModules: data.DiwoAssignment.Course.totalModules,
				};

				if (course_status == 'Not Started') {
					notStartedCourse.push(payload);
				} else if (course_status == 'In Progress') {
					inProgressCourse.push(payload);
				} else {
					completedCourse.push(payload);
				}
			}
		}
		courseList = [...inProgressCourse, ...notStartedCourse, ...completedCourse];

		return ResponseSuccess(res, {
			data: { courseList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getUserAssignAllCourseList = getUserAssignAllCourseList;

const getDiwoPWAPathwayDetailById = async function (req, res) {
	try {
		let DiwoAssignmentId = parseInt(req.params.diwoAssignmentId);
		let PathwayId = parseInt(req.params.pathwayId);
		let UserId = req.user.id;
		let getPatwayDetails, getAllCourseData, getCetificatedata;
		let assignmentCopy;
		//Need Pathway Details;
		//Need Course Details;
		//Need Certificate Details

		/////////////Get Pathway Data///////////////////
		[err, assignmentCopy] = await to(
			DiwoAssignment.findOne({
				where: {
					id: DiwoAssignmentId,
				},
				attributes: ['assignmentCopy'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (assignmentCopy?.assignmentCopy != null && JSON.parse(assignmentCopy.assignmentCopy)) {
			getPatwayDetails = JSON.parse(assignmentCopy.assignmentCopy).Pathway;
			console.log('---------------------------------------00');
			console.log('---------------------------------------00');
		} else {
			console.log('---------------------------------------11');
			[err, getPatwayDetails] = await to(
				Pathway.findOne({
					where: {
						id: PathwayId,
					},
					attributes: [
						'id',
						'title',
						'subtitle',
						'description',
						'avatar',
						'avatar_file_name',
						'avatar_path',
						'status',
						'e_duration',
						'l_outcomes',
						'totalModules',
						'totalCourses',
					],
				})
			);
			if (err) return ResponseError(res, err, 500, true);
		}

		///////Get All Course List Data///////////
		[err, getAllCourseData] = await to(
			DiwoModuleAssign.findAll({
				where: {
					DiwoAssignmentId: DiwoAssignmentId,
				},
				attributes: ['id', 'CourseId', 'isAssignmentCertification'],
				include: [
					{
						model: Course,
						attributes: [
							'id',
							'title',
							'subtitle',
							'description',
							'avatar',
							'avatar_file_name',
							'avatar_path',
							'status',
							'e_duration',
							'l_outcomes',
							'totalModules',
						],
					},
					{
						model: SessionUser,
						attributes: ['id', 'ModuleStatus', 'isAccess', 'expiryDate', 'attendanceStatus', 'ModuleDepedencyIndex'],
						where: {
							UserId: UserId,
						},
						include: [
							{ model: CourseStatus, as: 'CS', attributes: ['id', 'status'] },
							{ model: PathwayStatus, as: 'PS', attributes: ['id', 'status'] },
							{ model: Session, attributes: ['id', 'status'] },
						],
						required: false,
					},
					{
						model: Workbook,
						attributes: ['id', 'title', 'descrip', 'e_duration', 'l_outcomes'],
						include: [
							{
								model: DiwoAsset,
								where: {
									forBrief: false,
									WorksheetId: {
										[Op.eq]: null,
									},
									type: 'Image',
								},
								attributes: ['id', 'fileName', 'path'],
							},
						],
					},
				],
				order: [['CourseIndex', 'ASC']],
			})
		);

		if (err) return ResponseError(res, err, 500, true);

		//Need to Remove Duplicate Courses
		let courseList = [];
		let certificate;
		for (let courseData of getAllCourseData) {
			courseData = courseData.convertToJSON();
			let preset = false;
			for (let data of courseList) {
				if (data.CourseId == courseData.CourseId) {
					preset = true;
				}
			}
			if (courseData.isAssignmentCertification) {
				certificate = courseData;
			}
			if (!preset && !courseData.isAssignmentCertification) {
				courseList.push(courseData);
			}
		}
		// console.log('---certificate--', certificate);
		if (certificate) {
			courseList.push(certificate);
		}

		//Change Course Data with Old ones
		if (assignmentCopy?.assignmentCopy != null && JSON.parse(assignmentCopy.assignmentCopy)) {
			let courseList_ = JSON.parse(assignmentCopy.assignmentCopy).Courses;
			if (courseList_?.length > 0) {
				for (let courseData of courseList) {
					for (let course of courseList_) {
						if (courseData.CourseId == course?.id) {
							courseData.Course = course;
							break;
						}
					}
				}
			}
		}

		return ResponseSuccess(res, {
			data: { pathwayList: getPatwayDetails, courseList: courseList },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoPWAPathwayDetailById = getDiwoPWAPathwayDetailById;

//get  Diwo Course By Using Id
const getDiwoPWACourseDetailById = async function (req, res) {
	try {
		const schema = Joi.object({
			courseId: Joi.number().integer().positive().required(),
			diwoAssignmentId: Joi.number().integer().positive().required(),
			courseindex: Joi.number().integer().min(0).required(),
		});
		const { error, value } = schema.validate({
			courseId: req.params.courseId,
			diwoAssignmentId: req.params.diwoAssignmentId,
			courseindex: req.query.courseIndex,
		});
		if (error) return ResponseError(res, { message: error.details[0].message }, 400);

		const { courseId, diwoAssignmentId, courseindex } = value;

		let err, diwoAssignments;
		// let courseId = req.params.courseId;
		// let diwoAssignmentId = req.params.diwoAssignmentId;
		// let CourseIndex = req.query.courseindex;

		[err, diwoAssignments] = await to(
			DiwoAssignment.findOne({
				where: {
					id: diwoAssignmentId,
				},
				include: [
					{
						model: Pathway,
						attributes: ['id', 'title', 'totalModules'],
					},
					{
						model: DiwoModuleAssign,
						where: {
							CourseId: courseId,
						},
						include: [
							{
								model: Course,
								attributes: [
									'id',
									'title',
									'subtitle',
									'description',
									'status',
									'e_duration',
									'l_outcomes',
									'totalModules',
									'avatar_file_name',
								],
							},
							{
								model: Workbook,
								attributes: ['id', 'title', 'descrip', 'e_duration', 'l_outcomes'],
								include: [
									{
										model: DiwoAsset,
										where: {
											forBrief: false,
											WorksheetId: {
												[Op.eq]: null,
											},
											type: 'Image',
										},
										attributes: ['id', 'fileName', 'path'],
									},
									{ model: DiwoModule, attributes: ['id', 'type'] },
								],
							},
							{
								model: SessionUser,
								where: {
									UserId: req.user.id,
								},
								attributes: ['id', 'attendanceStatus', 'isAccess', 'ModuleStatus', 'ModuleDepedencyIndex'],
								include: [
									{
										model: Session,
										attributes: ['id', 'title', 'status', 'SessionStartDate', 'enddateWithTime'],
									},
									{
										model: SessionWorksheet,
										attributes: ['id', 'type'],
									},
									{
										model: CourseStatus,
										as: 'CS',
										attributes: ['id', 'status'],
									},
								],
							},
						],
						attributes: ['id', 'CourseIndex', 'DiwoAssignmentId', 'ModuleIndex'],
					},
				],
				attributes: ['id', 'PathwayId', 'CourseId', 'WorkbookId', 'assignmentCopy'],
				order: [[DiwoModuleAssign, 'ModuleIndex', 'ASC']],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (diwoAssignments?.assignmentCopy != null) {
			diwoAssignments = JSON.parse(JSON.stringify(diwoAssignments));
			console.log('----1---');
			let temp = JSON.parse(diwoAssignments.assignmentCopy);
			for (let data of diwoAssignments.DiwoModuleAssigns) {
				console.log('----2---');

				if (temp?.Course) {
					console.log('----3---');

					if (data?.Course?.id == temp.Course.id) {
						console.log('----4---');

						data.Course = temp.Course;
					}
				} else if (temp?.Courses?.length > 0) {
					for (let data_ of temp.Courses) {
						if (data_.id == data?.Course?.id) {
							console.log('----5---');

							data.Course = data_;
							break;
						}
					}
				}
			}
		}

		return ResponseSuccess(res, {
			data: { diwoAssignments },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDiwoPWACourseDetailById = getDiwoPWACourseDetailById;

const getDependencyModuleDetails = async function (req, res) {
	try {
		let SessionUserId = parseInt(req.params.SessionUserId);
		let dependencyIndex = req.body.dependencyIndex;

		let whereCondition = {
			id: {
				[Op.ne]: SessionUserId,
			},
			ModuleStatus: ['Not Started', 'In Progress'],
		};

		if (['No Dependency', 'ALL', null, ''].indexOf(dependencyIndex) == -1) {
			let index = dependencyIndex.split(',');
			whereCondition.ModuleIndex = index.map((str) => parseInt(str));
		}

		//Get PathwayStatusId AND CourseStatusId
		[err, getModuleDetails] = await to(
			SessionUser.findOne({
				where: {
					id: SessionUserId,
				},
				attributes: ['id', 'CourseStatusId', 'PathwayStatusId', 'DiwoAssignmentId'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getModuleDetails) {
			//Check this is Pathway or Course
			// if (getModuleDetails.PathwayStatusId) {
			// 	whereCondition.PathwayStatusId = getModuleDetails.PathwayStatusId;
			// } else if (getModuleDetails.CourseStatusId) {
			// 	whereCondition.CourseStatusId = getModuleDetails.CourseStatusId;
			// }

			if (getModuleDetails.DiwoAssignmentId) {
				whereCondition.DiwoAssignmentId = getModuleDetails.DiwoAssignmentId;
			}
		}

		// console.log('-whereCondition-', whereCondition);

		let title = [];

		[err, getModuleDetauls] = await to(
			SessionUser.findAll({
				where: whereCondition,
				include: [{ model: Workbook, attributes: ['id', 'title'] }],
				attributes: ['id', 'ModuleStatus'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (getModuleDetauls.length > 0) {
			for (let data of getModuleDetauls) {
				title.push(data.Workbook.title);
			}
		}
		let message = `You must complete ${title.toString()} before starting this module.`;

		if (title.length == 0) {
			message = MESSAGE.REFRESHPAGE;
		}

		return ResponseSuccess(res, {
			message,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getDependencyModuleDetails = getDependencyModuleDetails;

const checkPlannedSessionStatusBySessionId = async function (req, res) {
	try {
		let sessionIds = req.body;
		let SessionDetails;

		[err, SessionDetails] = await to(
			Session.findAll({
				where: {
					id: sessionIds,
				},
				attributes: ['id', 'status'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: { SessionDetails },
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.checkPlannedSessionStatusBySessionId = checkPlannedSessionStatusBySessionId;

const getWorkbooksCoursesPathwaysCertificatesBadgesCount = async function (req, res) {
	try {
		let userId = req.user.id;

		let CountListpayload = {
			workbooksCount: 0,
			coursesCount: 0,
			pathwaysCount: 0,
			certificatesCount: 0,
			badgesCount: 0,
			totalLearningMinutes: 0,
		};

		console.log('--userId--', userId);

		// Fetch Workbook Count
		let [err1, EdurationMinutes] = await to(
			SessionUser.findAll({
				where: {
					UserId: userId,
					isDeleted: false,
					ModuleStatus: ['Completed', 'Certified'],
				},
				include: [
					{
						model: Workbook,
						attributes: ['e_duration'],
					},
				],
			})
		);
		if (err1) return ResponseError(res, err1, 500, true);

		// Extract and sum e_duration values
		let TotalLearningMinutes = EdurationMinutes.reduce((sum, session) => {
			return sum + (session.Workbook?.e_duration || 0);
		}, 0);

		CountListpayload.workbooksCount = EdurationMinutes?.length;
		CountListpayload.totalLearningMinutes = TotalLearningMinutes;

		let [err5, LearnerAchievementData] = await to(
			LearnerAchievement.findAll({
				where: {
					UserId: userId,
				},
				attributes: ['id', 'isBadge', 'isCertificate'],
			})
		);
		if (err5) return ResponseError(res, err5, 500, true);

		if (LearnerAchievementData.length > 0) {
			for (let data of LearnerAchievementData) {
				if (data.isBadge) {
					CountListpayload.badgesCount += 1;
				}
				if (data.isCertificate) {
					CountListpayload.certificatesCount += 1;
				}
			}
		}

		// [pathwaysCountData] = await sequelize.query(`
		// 	SELECT COUNT(DISTINCT "PS".id) AS pathway_status_count
		// 		FROM "PathwayStatuses" AS "PS"
		// 		JOIN "SessionUsers" AS "SU"
		// 		ON "PS".id = "SU"."PathwayStatusId"
		// 		WHERE "SU"."UserId" = ${userId}
		// 		AND "PS".status IN ('Completed', 'Certified');`);

		// console.log('pathwaysCountData', pathwaysCountData);
		// CountListpayload.pathwaysCount = pathwaysCountData[0].pathway_status_count;

		// [coursesCountData] = await sequelize.query(`
		// 	SELECT COUNT(DISTINCT "CS".id) AS course_status_count
		// FROM "CourseStatuses" AS "CS"
		// JOIN "SessionUsers" AS "SU"
		// ON "CS".id = "SU"."CourseStatusId"
		// WHERE "SU"."UserId" = ${userId}
		// AND "CS".status IN ('Completed', 'Certified');`);

		// CountListpayload.coursesCount = coursesCountData[0].course_status_count;

		const pathwaysQuery = `
			SELECT COUNT(DISTINCT "PS".id) AS pathway_status_count
			FROM "PathwayStatuses" AS "PS"
			JOIN "SessionUsers" AS "SU" ON "PS".id = "SU"."PathwayStatusId"
			WHERE "SU"."UserId" = :userId
			AND "PS".status IN ('Completed', 'Certified');
		`;

		const pathwaysCountData = await sequelize.query(pathwaysQuery, {
			replacements: { userId },
			type: sequelize.QueryTypes.SELECT,
		});

		console.log('pathwaysCountData', pathwaysCountData);
		CountListpayload.pathwaysCount = pathwaysCountData[0]?.pathway_status_count || 0;

		const coursesQuery = `
			SELECT COUNT(DISTINCT "CS".id) AS course_status_count
			FROM "CourseStatuses" AS "CS"
			JOIN "SessionUsers" AS "SU" ON "CS".id = "SU"."CourseStatusId"
			WHERE "SU"."UserId" = :userId
			AND "CS".status IN ('Completed', 'Certified');
		`;

		const coursesCountData = await sequelize.query(coursesQuery, {
			replacements: { userId },
			type: sequelize.QueryTypes.SELECT,
		});

		CountListpayload.coursesCount = coursesCountData[0]?.course_status_count || 0;

		return ResponseSuccess(res, { data: CountListpayload });
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getWorkbooksCoursesPathwaysCertificatesBadgesCount = getWorkbooksCoursesPathwaysCertificatesBadgesCount;
