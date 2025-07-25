const { User, User_preference, Op, Client, System_branding, DiwoSystemBranding } =
	require('../models1/connectionPool')['global'];
const dbInstance = require('../models1/connectionPool');
const fs = require('fs');
const { sendMail, setSender } = require('./mail.service');
let env = process.env.API_APP || 'production';
const CONFIG = require('../config/config')[env];
const config_feature = require('../config/SiteConfig.json');

const { to, ThrowException, ResponseError } = require('../services/util.service');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const Sequelize = require('sequelize');
const sendRegistrationMail = async function (sender, userEmail, name) {
	let msg = {};
	msg = await setSender(sender, msg);

	msg.to = userEmail;
	msg.template_id = `${CONFIG.registration_Mail}`;
	msg.dynamicTemplateData = {
		name: name,
	};
	return sendMail(msg);
};
module.exports.sendRegistrationMail = sendRegistrationMail;

const sendOTPMail = async function (userEmail, OTP, type) {
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = CONFIG.sendgrid_drip_otp_template;

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = CONFIG.sendgrid_diwo_otp_template;
	}

	// console.log('----------------msg.template_id----', msg.template_id);
	msg.to = userEmail;
	msg.dynamicTemplateData = {
		otp: OTP,
	};
	// console.log('---OTP--msg----', msg);
	return sendMail(msg);
};
module.exports.sendOTPMail = sendOTPMail;


const sendUserWelcomeEmailToAdmin = async function (userDetails, type) {
	let msg = {};

	console.log('type', type);

	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.drip_admin_welcome_email}`;
		let first_name = userDetails.firstName;
		let Drip = userDetails.projectName;
		msg.subject = `Welcome to Drip, ${{first_name}}! Let’s Get Started 🚀`
	}		

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_admin_welcome_email}`;
		msg.subject = 'Welcome to Diwo!';
	}

	msg.to = userDetails.email_id;
	// msg.to = 'infernoraj19@gmail.com';	

	console.log('userDetails.ClientsDetails', userDetails.ClientsDetails);

	// Format the workspace description text
	// const formattedClientRoleInfo = userDetails.ClientsDetails.map(client => {
	// 	const roleText = Array.isArray(client.roles) ? client.roles.join(', ') : client.roles;
	// 	return `${client.name}'s workspace as a ${roleText}`;
	// }).join(', ');

	const formattedClientRoleInfo = userDetails.ClientsDetails.map(client => {
		const roleText = Array.isArray(client.roles) ? client.roles.join(', ') : client.roles;
		return `${client.name}'s workspace as a ${roleText}`;
	}).join('<br>');
	
	userDetails.client_name = formattedClientRoleInfo; 
	
	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,
		client_name: userDetails.client_name,
		// branch_name: branchName,
		user_role: '', // Not needed anymore
		email_id: userDetails.email_id,
		Signature: userDetails.emailSignatureText,
		// Signature: 'http://qa11.gobablr.com:3500/public/uploads/uploads/diwo_assets/tDrFs-f8r_1741002929921.png',		
	};

	console.log('Welcome Email', msg.dynamicTemplateData);
	return sendMail(msg);
};
module.exports.sendUserWelcomeEmailToAdmin = sendUserWelcomeEmailToAdmin;


const sendEditingUserEmailToAdmin = async function (userDetails, type) {
	let msg = {};	

	if (type === 'drip') {
		msg.from = {
			email: CONFIG.sendgrid_drip_sender_email,
			name: CONFIG.sendgrid_drip_sender_name,
		};
		msg.template_id = `${CONFIG.drip_edit_admin_user_email}`;

		console.log('userDeatils in drip', userDetails);
		console.log('userDetails.user_name_one_one_whose_role_changed', userDetails.user_name_one_one_whose_role_changed);

		// msg.subject = `User Role for ${userDetails.user_name_one_one_whose_role_changed} has changed in Drip`;	
	}
	
	if (type === 'diwo') {
		msg.from = {
			email: CONFIG.sendgrid_diwo_sender_email,
			name: CONFIG.sendgrid_diwo_sender_name,
		};
		msg.template_id = `${CONFIG.diwo_edit_admin_user_email}`;		
		// msg.subject = `User Role for ${userDetails.user_name_one_one_whose_role_changed} has changed in Diwo`;		
	}		

	msg.to = userDetails.email_id;	
	// msg.to = 'infernoraj19@gmail.com';	

	// Generate formatted client-role string
	const formattedClientRoleList = userDetails.ClientsDetails.map(item => {
		const roles = item.RoleName.join(', ');
		return `${item.ClientName} - Roles: ${roles}`;
	}).join('<br>');	

	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,
		user_name_of_one_who_changed_role: userDetails.user_name_of_one_who_changed_role,
		user_name_one_one_whose_role_changed: userDetails.user_name_one_one_whose_role_changed,
		client_name	: formattedClientRoleList,		
		Signature: userDetails.emailSignatureText || '',
		user_name: userDetails.user_name_one_one_whose_role_changed,	
	};

	// Only for DIWO environment, add branch_name and user_role
	if (type === 'diwo') {
		msg.dynamicTemplateData.branch_name = '';
		msg.dynamicTemplateData.user_role = '';
	}

	if (type === 'drip') {
		msg.dynamicTemplateData.Drip = 'Drip';
		msg.dynamicTemplateData.user_name = userDetails.user_name_one_one_whose_role_changed;
	}
	
	console.log("Template Data:", msg.dynamicTemplateData);

	return sendMail(msg);	
};
module.exports.sendEditingUserEmailToAdmin = sendEditingUserEmailToAdmin;


const bulksendCreatePassEmailToLearner = async function (userDetails, type) {
	let msg = {};

	console.log('userDetails',userDetails);
	console.log('type of ', typeof(userDetails));
	
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.drip_create_learner_password_email}`;		
	}	

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_create_learner_password_email}`;
	}

	msg.to = userDetails.dynamic_template_data.email;

	console.log('msg.to', msg.to);
	console.log('msg.template_id', msg.template_id);
	// msg.subject = `Welcome to Diwo, ${userDetails.firstName}! Let’s Get You Started 🚀`;	

	msg.dynamicTemplateData = {
		first_name: userDetails.dynamic_template_data.firstName,		
		Weblink: userDetails.dynamic_template_data.redirect_url,		
		Signature: userDetails.dynamic_template_data.emailSignatureTextForLearner || '',		
	};

	
	if (type === 'diwo') {
		msg.dynamicTemplateData.Diwo = userDetails.dynamic_template_data.projectName;
		msg.dynamicTemplateData.email_id = userDetails.dynamic_template_data.email;
	}

	if (type === 'drip') {
		msg.dynamicTemplateData.client_name = userDetails.dynamic_template_data.clientName;		
	}

	console.log('Welcome Email to create pass', msg.dynamicTemplateData);
	// return sendMail(msg);

	try {
		await sgMail.send(msg);
		console.log('Email sent successfully');
	  } catch (error) {
		console.error(' SendGrid error:', error.response?.body || error.message || error);
	}	

};
module.exports.bulksendCreatePassEmailToLearner = bulksendCreatePassEmailToLearner;


const sendCreatePassEmailToLearner = async function (userDetails, type) {
	let msg = {};
	
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.drip_create_learner_password_email}`;		
	}	

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_create_learner_password_email}`;
	}

	msg.to = userDetails.email;

	console.log('msg.to', msg.to);
	console.log('msg.template_id', msg.template_id);
	// msg.subject = `Welcome to Diwo, ${userDetails.firstName}! Let’s Get You Started 🚀`;	

	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,		
		Weblink: userDetails.redirect_url,		
		Signature: userDetails.emailSignatureTextForLearner || '',		
	};

	
	if (type === 'diwo') {
		msg.dynamicTemplateData.Diwo = userDetails.projectName;
		msg.dynamicTemplateData.email_id = userDetails.email;
	}

	if (type === 'drip') {
		msg.dynamicTemplateData.client_name = userDetails.clientName;		
	}

	console.log('Welcome Email to create pass', msg.dynamicTemplateData);
	// return sendMail(msg);

	try {
		await sgMail.send(msg);
		console.log('Email sent successfully');
	  } catch (error) {
		console.error(' SendGrid error:', error.response?.body || error.message || error);
	}	

};
module.exports.sendCreatePassEmailToLearner = sendCreatePassEmailToLearner;



const sendUserWelcomeEmailToLearner = async function (userDetails, type) {
	let msg = {};
	
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.drip_learner_welcome_email}`;
		msg.subject = `Welcome to Drip – Your Learning Journey Begins!`
	}

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_welcome_email}`;
		msg.subject = `Welcome to Diwo, ${userDetails.firstName}!`
	}

	msg.to = userDetails.email;

	msg.dynamicTemplateData = {
		first_name : userDetails.firstName,		
		// Signature: userDetails.emailSignatureText,		
	};

	// Only for DIWO environment, add branch_name and user_role
	if (type === 'diwo') {
		msg.dynamicTemplateData.Signature = userDetails?.emailSignatureText ? userDetails.emailSignatureText : '';	
	}

	if (type === 'drip') {
		msg.dynamicTemplateData.client_name = userDetails.clientName;	
	}

	console.log('Welcome Email', msg.dynamicTemplateData);
	return sendMail(msg);
};
module.exports.sendUserWelcomeEmailToLearner = sendUserWelcomeEmailToLearner;


const bulksendUserWelcomeEmailToLearner = async function (userDetails, type) {
	let msg = {};
	
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.drip_learner_welcome_email}`;
		msg.subject = `Welcome to Drip – Your Learning Journey Begins!`
	}

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_welcome_email}`;
		// msg.subject = `Welcome to Diwo, ${userDetails.dynamic_template_data.firstName}!`
	}

	msg.to = userDetails.dynamic_template_data.email;

	msg.dynamicTemplateData = {
		first_name : userDetails.dynamic_template_data.firstName,		
		// Signature: userDetails.dynamic_template_data.emailSignatureText,		
	};

	// Only for DIWO environment, add branch_name and user_role
	if (type === 'diwo') {
		msg.dynamicTemplateData.Signature = userDetails?.dynamic_template_data?.emailSignatureText ? userDetails.dynamic_template_data.emailSignatureText : '';	
	}

	if (type === 'drip') {
		msg.dynamicTemplateData.client_name = userDetails.dynamic_template_data.clientName;	
	}

	try {
		await sgMail.send(msg);
		console.log('Email sent successfully');
	  } catch (error) {
		console.error(' SendGrid error:', error.response?.body || error.message || error);
	}

};
module.exports.bulksendUserWelcomeEmailToLearner = bulksendUserWelcomeEmailToLearner;


const sendModalAssignEmailToTrainer = async function (userDetails, type) {
	let msg = {};
	
	// WE ONLY HAD MODAL ASSIGN ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_modal_assign_to_trainer_email}`;
	}

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_modal_assign_to_trainer_email}`;
	}

	msg.to = userDetails.email;
	msg.subject = `New Module Assigned to You on ${userDetails.projectName} `

	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,
		assigned_date  : '',
		module_title : userDetails.workbookTitle,
		Diwo : userDetails.projectName,
		Signature: userDetails.signature,		
	};

	console.log('Welcome Email', msg.dynamicTemplateData);
	return sendMail(msg);
};
module.exports.sendModalAssignEmailToTrainer = sendModalAssignEmailToTrainer;

const reminder07DaysSendEmailToLearner = async function (userDetails, type) {
	let msg = {};

	// WE ONLY HAD MODAL ASSIGN ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH FOR REMINDER
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_07_days_reminder_to_learner_for_due_date_modal_email}`;
	}
	
	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_07_days_reminder_to_learner_for_due_date_modal_email}`;
	}

	msg.to = userDetails.email;
	module_name = userDetails.workbookTitle;
	msg.subject = `7 Days Left to Complete Your Diwo Module: ${module_name} `	

	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,
		due_date  : userDetails.assigned_date,
		module_name : userDetails.workbookTitle,
		Diwo : userDetails.projectName,
		Signature: userDetails.signature,		
	};

	console.log('Welcome Email', msg.dynamicTemplateData);
	return sendMail(msg);
};
module.exports.reminder07DaysSendEmailToLearner = reminder07DaysSendEmailToLearner;

const reminder01DaysSendEmailToLearner = async function (userDetails, type) {
	let msg = {};

	// WE ONLY HAD MODAL ASSIGN ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH FOR REMINDER
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_01_days_reminder_to_learner_for_due_date_modal_email}`;		
	}

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_01_days_reminder_to_learner_for_due_date_modal_email}`;;
	}

	msg.to = userDetails.email;	
	console.log('userDetails.email_id', userDetails.email);
	// msg.to = 'infernoraj19@gmail.com';
	// msg.subject = `⏰ Reminder: Your Module is Due Tomorrow! `	

	msg.dynamicTemplateData = {
		first_name: userDetails.firstName,
		due_date  : userDetails.assigned_date,
		module_title : userDetails.workbookTitle,
		Diwo : userDetails.projectName,
		Signature: userDetails.signature || '',		
	};

	console.log('Welcome Email', msg.dynamicTemplateData);
	// return sendMail(msg);
	try {
		await sgMail.send(msg);
		console.log('Email sent successfully');
	  } catch (error) {
		console.error(' SendGrid error:', error.response?.body || error.message || error);
	}	
};
module.exports.reminder01DaysSendEmailToLearner = reminder01DaysSendEmailToLearner;


const CertificationCompletitionSendEmailToLearner = async function (userDetails, type) {
	let msg = {};

	// WE ONLY HAD CERTIFICATE COMPLETITION ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH 
	if (type === 'Drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_certification_completition_send_email}`;
	}	

	if (type === 'Diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_certification_completition_send_email}`;
	}

	msg.to = userDetails.email;
	// msg.to = 'infernoraj19@gmail.com';
	// msg.subject = ` Congratulations! You’ve Completed Your Certification 🎉`	
	
	const completion_date = userDetails.date 
    ? new Date(userDetails.date).toISOString().split("T")[0]
    : '';

	msg.dynamicTemplateData = {
		first_name : userDetails.firstName,
		Diwo  : userDetails.projectName,
		certification_name  : userDetails?.CertificateLine2,
		completion_date   : completion_date,
		Signature: userDetails.emailSignatureText || '',		
	};	

	console.log('Welcome Email', msg.dynamicTemplateData);
	// return sendMail(msg);	

	try {
		await sgMail.send(msg);
		console.log('Email sent successfully');
	  } catch (error) {
		console.error(' SendGrid error:', error.response?.body || error.message || error);
	}
	  
};
module.exports.CertificationCompletitionSendEmailToLearner = CertificationCompletitionSendEmailToLearner;

const CourseCompletitionSendEmailToLearner = async function (userDetails, type) {
	let msg = {};

	// WE ONLY HAD COURSE COMPLETITION ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH 
	// TEMPLATE ID FOR PATHWAY AND COURSE IS SAME
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_course_completition_send_email}`; 
	}	

	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_course_completition_send_email}`;
	}

	const course_name_or_pathway_name = userDetails?.course_name;

	msg.to = userDetails.email;
	// msg.to = 'infernoraj19@gmail.com';	
	// msg.subject = ` You have Successfully Completed ${{course_name_or_pathway_name}}! 🎓`	
		

	msg.dynamicTemplateData = {
		first_name : userDetails.firstName,
		Diwo  : userDetails.projectName,
		course_name_or_pathway_name: course_name_or_pathway_name, 
		completion_date   : userDetails.completion_date,
		Signature: userDetails.emailSignatureText || '',		
	};

	console.log('Welcome Email', msg);
	// return sendMail(msg);	

	try {
		const response = await sendMail(msg);
		console.log('Email Sent:', response);
		return response;
	} catch (error) {
		console.error('SendGrid Error:', error?.response?.body || error.message || error);
		throw error;
	}

};
module.exports.CourseCompletitionSendEmailToLearner = CourseCompletitionSendEmailToLearner;

const PathwayCompletitionSendEmailToLearner = async function (userDetails, type) {
	let msg = {};

	// WE ONLY HAD PATHWAY COMPLETITION ONLY IN DIWO, SO THE TEMPLATE IS SAME FOR BOTH 
	// PATHWAY AND COURSE COMPLETITION HAD THE SAME TEMPLATE ID
	if (type === 'drip') {
		msg.from = {
			email: `${CONFIG.sendgrid_drip_sender_email}`,
			name: `${CONFIG.sendgrid_drip_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_pathway_completition_send_email}`;
	}
	
	if (type === 'diwo') {
		msg.from = {
			email: `${CONFIG.sendgrid_diwo_sender_email}`,
			name: `${CONFIG.sendgrid_diwo_sender_name}`,
		};
		msg.template_id = `${CONFIG.diwo_learner_pathway_completition_send_email}`;
	}
	
	const course_name_or_pathway_name = userDetails?.pathway_name;

	msg.to = userDetails.email;
	// msg.to = 'infernoraj19@gmail.com';	
	// msg.subject = ` You have Successfully Completed ${{course_name_or_pathway_name}}! 🎓`	
		

	msg.dynamicTemplateData = {
		first_name : userDetails.firstName,
		Diwo  : userDetails.projectName,
		course_name_or_pathway_name: course_name_or_pathway_name, 
		completion_date : userDetails.completion_date,
		Signature: userDetails?.emailSignatureText		
	};

	console.log('Welcome Email', msg);
	return sendMail(msg);	
};
module.exports.PathwayCompletitionSendEmailToLearner = PathwayCompletitionSendEmailToLearner;


const sendDripEmail = async function (personalizations, senderDetails) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${senderDetails.EmailSenderId}`,
		name: `${senderDetails.EmailSenderName}`,
	};
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	msg.to = msg.personalizations[0].to;
	msg.template_id = senderDetails.EmailTemplateId;
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----msg----', msg.personalizations[0].dynamic_template_data);
		console.log('-----msg----', msg);
		return sendMail(msg);
	}

	// let msg = {
	// 	from: {
	// 		email: `${senderDetails.EmailSenderId}`,
	// 		name: `${senderDetails.EmailSenderName}`,
	// 	},
	// };
	// msg.to = personalizations[0].to;
	// msg.template_id = senderDetails.EmailTemplateId;
	// msg.dynamicTemplateData = personalizations[0].dynamic_template_data;
	// if (env == 'dev' || env == 'development' || env == 'Staging') {
	// 	msg.sandbox_mode = { enable: true };
	// }
	// console.log('---sendDripEmail--msg----', msg);
	// return sendMail(msg);
};
module.exports.sendDripEmail = sendDripEmail;

const sendOnlyEmailDrip = async function (personalizations, senderDetails) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${senderDetails.EmailSenderId}`,
		name: `${senderDetails.EmailSenderName}`,
	};
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	msg.to = msg.personalizations[0].to;
	msg.template_id = senderDetails.OnlyEmailTemplateId;
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----msg----', msg.personalizations[0].dynamic_template_data);
		console.log('-----msg----', msg);
		return sendMail(msg);
	}

	// let msg = {
	// 	from: {
	// 		email: `${senderDetails.EmailSenderId}`,
	// 		name: `${senderDetails.EmailSenderName}`,
	// 	},
	// };
	// msg.to = personalizations[0].to;
	// msg.template_id = senderDetails.EmailTemplateId;
	// msg.dynamicTemplateData = personalizations[0].dynamic_template_data;
	// if (env == 'dev' || env == 'development' || env == 'Staging') {
	// 	msg.sandbox_mode = { enable: true };
	// }
	// console.log('---sendOnlyEmailDrip--msg----', msg);
	// return sendMail(msg);
};
module.exports.sendOnlyEmailDrip = sendOnlyEmailDrip;

const sendDripBroadSideEmail = async function (emailData, accessToken) {
	try {
		const url = `http://52.66.123.174:8081/send`;
		let personalizationsArray = [];
		for (let email of emailData) {
			const payload = {
				txId: email.txId,
				from: 'soniya@bablr.in',
				to: email.to,
				replyTo: 'soniya@bablr.in',
				subject: email.subject,
				// template: email.body,
				// cid: [
				// 	{
				// 		filePath: '/var/warehouse/data/remiges.jpeg',
				// 	},
				// ],
				template: email.template,
				cid: email.cid,
				attachments: email.attachments,
				// attachments: [
				// 	{
				// 		filePath: '/var/warehouse/data/Broadside_ File_Upload.pdf',
				// 	},
				// ],
				params: email.params,
				tags: {
					content_type: 'text/html',
				},
				options: {
					tag_prefix: 'Y-',
				},
			};
			console.log('-broadside send mail payload-', payload);
			personalizationsArray.push(payload);
		}

		//Send BroadSide Email
		const response = await axios.post(
			url,
			{ data: personalizationsArray },
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);
		console.log('-------Broadside send mail response-----', response.data);
		return response.data;
	} catch (error) {
		console.log('Error When Send BroadSide Email', error);
		return null;
	}
};
module.exports.sendDripBroadSideEmail = sendDripBroadSideEmail;

//Drip WhatsApp License Consume Email Trigger
const sendDripWhatsAppLicenseEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.drip_whatsapp_license_Email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendDripWhatsAppLicenseEmail = sendDripWhatsAppLicenseEmail;

//Drip Email License Consume Email Trigger
const sendDripEmailLicenseEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.drip_email_license_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendDripEmailLicenseEmail = sendDripEmailLicenseEmail;

const policyChangeNotificationEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = `${CONFIG.sendgrid_drip_sender_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	msg.template_id = `${CONFIG.policy_change_notification_email}`;
	if (personalizationsArray.length > 0) {
		return sendMail(msg);
	}
};
module.exports.policyChangeNotificationEmail = policyChangeNotificationEmail;

const notificationEmail = async function (personalizations, type, clientId, projectType) {
	try {
		let senderDetails;
		if (projectType === 'drip') {
			senderDetails = await getClientEmailConfigrationDetails(clientId);
		} else if (projectType === 'diwo') {
			senderDetails = await getClientEmailConfigrationDetailsForDiwo(clientId);
		}
		let personalizationsArray = [];
		for (const i in personalizations) {
			personalizationsArray.push(personalizations[i]);
		}
		let sendEmail = true;
		let msg = {};
		//msg.from = `${CONFIG.sendgrid_drip_sender_email}`;
		if (senderDetails && senderDetails.EmailSenderId) {
			msg.from = {
				email: `${senderDetails.EmailSenderId}`,
				name: `${senderDetails.EmailSenderName}`,
			};
			msg.personalizations = personalizationsArray;
			if (env == 'dev' || env == 'development' || env == 'Staging') msg.sandbox_mode = { enable: true };
			if (type === 'Template Reject') {
				msg.template_id = `${CONFIG.template_reject}`;
			} else if (type === 'WhatsApp Account Login Filed') {
				msg.template_id = `${CONFIG.whatsapp_account_login_failed}`;
			} else if (type === 'Workbook Pre Assigned') {
				msg.template_id = CONFIG.sendgrid_workbook_assigned_template;
			} else if (type === 'New Ticket') {
				msg.template_id = `${CONFIG.new_ticket}`;
			} else if (type === 'New User Registration For Diwo') {
				msg.template_id = `${CONFIG.new_user_registration_for_diwo}`;
			} else if (type === 'New User Registration For Drip') {
				msg.template_id = `${CONFIG.new_user_registration_for_drip}`;
			} else {
				sendEmail = false;
			}

			if (sendEmail && personalizationsArray.length > 0) {
				return sendMail(msg);
			}
		}
		return;
	} catch (error) {
		return;
	}
};
module.exports.notificationEmail = notificationEmail;

const getClientEmailConfigrationDetails = async function (clientId) {
	try {
		let appBranding;
		let flag = true;
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [
					{
						model: System_branding,
						attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.SystemBrandingId) {
			appBranding = client.System_branding.convertToJSON();
		} else {
			let parentClientId = client.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
						include: [
							{
								model: System_branding,
								attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClient && parentClient.SystemBrandingId) {
					appBranding = parentClient.System_branding.convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}

		return appBranding;
	} catch (error) {
		console.log('---Error When Get Client Email Configration details--', error);
	}
};
module.exports.getClientEmailConfigrationDetails = getClientEmailConfigrationDetails;

const getClientEmailConfigrationDetailsForDiwo = async function (clientId) {
	try {
		let appBranding;
		let flag = true;
		[err, client] = await to(
			Client.findOne({
				where: {
					id: clientId,
				},
				include: [
					{
						model: DiwoSystemBranding,
						attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		if (client && client.DiwoSystemBrandingId) {
			appBranding = client.DiwoSystemBranding.convertToJSON();
		} else {
			let parentClientId = client.Associate_client_id;
			let totalClientCount;
			let count = 0;

			[err, totalClientCount] = await to(Client.count());

			while (flag) {
				count++;
				if (count > totalClientCount) {
					flag = false;
					break;
				}
				[err, parentClient] = await to(
					Client.findOne({
						where: {
							id: parentClientId,
						},
						include: [
							{
								model: DiwoSystemBranding,
								attributes: ['id', 'EmailSenderId', 'EmailSenderName', 'EmailTemplateId'],
							},
						],
					})
				);
				if (err) return ResponseError(res, err, 500, true);
				if (parentClient && parentClient.DiwoSystemBrandingId) {
					appBranding = parentClient.DiwoSystemBranding.convertToJSON();
					flag = false;
				} else if (parentClient && parentClient.Associate_client_id) {
					parentClientId = parentClient.Associate_client_id;
				} else {
					flag = false;
				}
			}
		}

		return appBranding;
	} catch (error) {
		console.log('---Error When Get Client Email Configration details--', error);
	}
};
module.exports.getClientEmailConfigrationDetailsForDiwo = getClientEmailConfigrationDetailsForDiwo;

//Drip Bot Send Sent Received Count Email Trigger
const sendDripBotSentReceivedCountEmail = async function (personalizations) {
	let personalizationsArray = [];
	personalizationsArray.push(personalizations);
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.drip_bot_sent_received_count_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendDripBotSentReceivedCountEmail = sendDripBotSentReceivedCountEmail;

//Diwo Password Reset Email Trigger
const sendPasswordResetEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
	msg.template_id = `${CONFIG.diwo_password_reset_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----password reset msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendPasswordResetEmail = sendPasswordResetEmail;


//Diwo Password Reset Email Trigger
const sendPasswordResetEmailForDrip = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.drip_password_reset_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----password reset msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendPasswordResetEmailForDrip = sendPasswordResetEmailForDrip;

//Diwo Forgot Password Email Trigger
const sendForgotPasswordEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}	
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
		
	if(config_feature?.configurable_feature?.sles){
		msg.template_id = `${CONFIG.diwo_password_reset_email}`;
	}else{
		msg.template_id = `${CONFIG.diwo_learner_forgot_password_email}`;
	}	


	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----forgot password msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendForgotPasswordEmail = sendForgotPasswordEmail;


//Diwo Forgot Password Email Admin Trigger
const sendAdminForgotPasswordEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}	
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
		
	if(config_feature?.configurable_feature?.sles){
		msg.template_id = `${CONFIG.diwo_forgot_password_email}`;
	}else{
		msg.template_id = `${CONFIG.diwo_forgot_password_email}`;
	}	
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----forgot password msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendAdminForgotPasswordEmail = sendAdminForgotPasswordEmail;

//Diwo Reset Lockout Email Trigger
const sendResetLockoutEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
	msg.template_id = `${CONFIG.diwo_reset_lockout_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendResetLockoutEmail = sendResetLockoutEmail;

//Diwo Reset Lockout Email Trigger
const sendResetLockoutEmailToLearnerAsAdminUnlockAccount = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
	msg.template_id = `${CONFIG.admin_unlock_learner_account_reset_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendResetLockoutEmailToLearnerAsAdminUnlockAccount = sendResetLockoutEmailToLearnerAsAdminUnlockAccount;

//Diwo Reset Lockout Email Trigger Admin
const sendResetLockoutEmailToAdmin = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
	msg.template_id = `${CONFIG.diwo_admin_reset_lockout_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendResetLockoutEmailToAdmin = sendResetLockoutEmailToAdmin;

//Diwo Create Welcome Email Trigger Admin
const sendCreatePasswordEmailToAdmin = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_diwo_sender_email}`,
		name: `${CONFIG.sendgrid_diwo_sender_name}`,
	};
	msg.template_id = `${CONFIG.diwo_admin_welcome_with_create_password_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendCreatePasswordEmailToAdmin = sendCreatePasswordEmailToAdmin;

//Drip Reset Lockout Email Trigger
const sendResetLockoutEmailForDrip = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.drip_reset_lockout_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.sendResetLockoutEmailForDrip = sendResetLockoutEmailForDrip;

//System Alter Emails
const systemAlertEmail = async function (personalizations) {
	let personalizationsArray = [];
	for (const i in personalizations) {
		personalizationsArray.push(personalizations[i]);
	}
	let msg = {};
	msg.from = {
		email: `${CONFIG.sendgrid_drip_sender_email}`,
		name: `${CONFIG.sendgrid_drip_sender_name}`,
	};
	msg.template_id = `${CONFIG.system_alert_email}`;
	msg.personalizations = personalizationsArray;
	if (env == 'dev' || env == 'development' || env == 'Staging') {
		msg.sandbox_mode = { enable: true };
	}
	if (personalizationsArray.length > 0 && msg.template_id) {
		console.log('-----reset lockout msg----', msg);
		return sendMail(msg);
	}
};
module.exports.systemAlertEmail = systemAlertEmail;
