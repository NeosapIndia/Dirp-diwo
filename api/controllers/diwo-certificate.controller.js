const {
	Op,
	sequelize,
	Post,
	Post_detail,
	Post_header,
	Post_header_mapping,
	Campaign,
	User,
	User_group,
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
	Option,
	Course,
	Question,
	DiwoAsset,
	Course_workbook_mapping,
	Session,
	SessionUser,
	SessionQuestion,
	SessionWorksheet,
	SessionOption,
	SessionAsset,
	WorkbookTrainerMapping,
	WorkbookUserGroupMapping,
	SessionPhotograph,
	SessionQuestionSubmission,
	SurveyQueGroup,
	DiwoSpinWheelCat,
	DiwoAssignment,
	DiwoModule,
	Pathway,
	PathwayCourseMapping,
	LearnerAssignment,
	LearnerAchievement,
	User_role_client_mapping,
	Badge,
	LoginAppBranding,
} = require('../models1/connectionPool')['global'];

const dbInstance = require('../models1/connectionPool');
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const MESSAGE = require('../config/message');
const moment = require('moment');
const shortid = require('shortid');
const puppeteer = require('puppeteer');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];
const { checkProjectNameByType, checkClientIdAccess } = require('../services/auth.service');
const { getDiwoClientAppBrandingByClientId } = require('../services/client.service');
const Sequelize = require('sequelize');
const config_feature = require('../config/SiteConfig.json');

// ///////////////////////////////////////////////////////Certificate Design////////////////////////////////////////////////////////////

const generateLevelCertificate = async function (data) {
	return new Promise(async (resolve, reject) => {
		let err;
		let header;
		let loginAppbranding;

		[err, loginAppbranding] = await to(
			LoginAppBranding.findOne({
				where: { id: 1 },
				attributes: ['diwo_certificate_LogoPath'],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		let certficateImg =
			loginAppbranding && loginAppbranding.diwo_certificate_LogoPath
				? loginAppbranding.diwo_certificate_LogoPath
				: null;

		if (config_feature?.configurable_feature?.sles) {
			header = await Tasl_LevelCertificateTemplate(data, certficateImg);
		} else {
			header = await Saas_LevelCertificateTemplate(data, certficateImg);
		}

		[err, filename] = await to(gCertificatepdf(header, data.data.fileName));
		if (err) return reject(err);

		// console.log('---filename--', filename);
		return resolve(filename);
	});
};
module.exports.generateLevelCertificate = generateLevelCertificate;

async function Saas_LevelCertificateTemplate(data, certficateImg) {
	return (header =
		`
<!DOCTYPE html>
      <html>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            .shape_1 {
              background-color: ${data.data.color};
              width: 280px;
              height: 470px;
            }

            .trangle {
              width: 0px;
              height: 0px;
              border-top: 180px solid ${data.data.color};
              border-left: 140px solid transparent;
              border-right: 140px solid transparent;
            }

            .main {
              border: 15px solid ${data.data.color};
              padding: 10px;
              height: 794px;
            }

            .second-border {
              border: 2px solid ${data.data.color};
              padding: 20px;
              height: 750px;
            }

            .main-div {
              display: inline-flex;
              margin: 10px;
            }

            .col-1 {
              width: 700px;
              padding-left: 70px;
            }

            .col-2 {
              width: 350px;
              margin-top: -102px;
            }

            .heading {
              text-align: center;
              padding-top: 90px;
              color: white;
            }

            .logo {
              text-align: center;
              margin-top: 60px;
            }

            .img {
              width: 200px;
              height: auto;
            }

            .main-logo {
              margin-top: 20px;
              margin-left: 0px;
            }

            .main-logo img {
              width: 200px;
              height: auto;
            }

            .main-logo h1 {
              margin: 40px 0px 0px 30px;
            }

            .greenFont {
              color: ${data.data.color};
            }

            .footer-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 6rem;
              margin-left: 6rem;
    
            }

            .signatures {
              display: flex;
              gap: 11.25rem;
              font-size: 0.875rem;
            }

            .signatures div {
              text-align: center;
            }

            .signatures img {
              height: 3.125rem;
            }

            .sig-name {
              margin-top: 0.375rem;
            }

            .sig-role {
              margin-top: 0.125rem;
            }

          </style>
        </head>

        <body>
          <div class="main">
            <div class="second-border">
              <table>
                <tr>
                  <td>
                    <div class="main-div">
                      <div class="col-1">
                        <table class="main-logo">
                          <tr>
                            <td>
                              ` +
		`
                              <img src="${data.data.logoUrl}" />
                              ` +
		`
                            </td>
                          </tr>
                        </table>

                        <div style="margin-top: 50px">
                          <p style="font-size: 15px">
                            <font face="Poppins, sans-serif"
                              >${moment(data.data.date).format('MMM DD, YYYY')}</font
                            >
                          </p>
                        </div>
                        <div
                          style="margin-top: 45px; font-weight: bold"
                          class="greenFont"
                        >
                          <span style="text-transform: capitalize; font-size: 40px"
                            ><font face="Poppins, sans-serif"
                              >${data.data.name}</font
                            ></span
                          >
                        </div>
                        <div style="margin-top: 20px">
                          <font face="Poppins, sans-serif">
                            <p style="font-size: 15px">
                              ${data.data.CertificateLine1}
                            </p></font
                          >
                        </div>
                        <div style="margin-top: 20px">
                          <font face="Poppins, sans-serif">
                            <p style="font-size: 30px">
                              <span class="greenFont"
                                >${data.data.CertificateLine2}
                              </span>
                            </p></font
                          >
                        </div>
                        <div style="margin-top: 20px">
                          <p style="font-size: 15px; line-height: 1.4">
                            <font face="Poppins, sans-serif">
                              ${data.data.CertificateLine3}
                            </font>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="footer-row">
                        <div class="signatures">
                          ${
														data.data.signaturePath1
															? `
                          <div>
                              <img src="${data.data.signaturePath1}"/>
                              <div class="sig-name">
                                <font face="Poppins, sans-serif">${data.data.signatureName1}</font>
                              </div>
                              <div class="sig-role">
                                <font face="Poppins, sans-serif">${data.data.signatureDesignation1}</font>
                              </div>
                          </div>
                          `
															: ''
													}
                            ${
															data.data.signaturePath2
																? `
                          <div>
                              <img src="${data.data.signaturePath2}"/>
                              <div class="sig-name">
                                <font face="Poppins, sans-serif">${data.data.signatureName2}</font>
                              </div>
                              <div class="sig-role">
                                <font face="Poppins, sans-serif">${data.data.signatureDesignation2}</font>
                              </div>
                          </div>
                            `
																: ''
														}
                      </div>
                  </div>



                  </td>


                  <td>
                    <div class="col-2">
                      <div class="shape_1">
                        <div class="heading">
                          <font face="Poppins, sans-serif">
                            <h1>DIGITAL</h1>
                            <h1>CERTIFICATE</h1></font
                          >
                        </div>
                        <div class="logo">
                          <img
                            [src]="${CONFIG.image_host}${certficateImg}"
                            class="img"
                          />
                        </div>
                      </div>
                      <div class="trangle"></div>
                    </div>

                  </td>
                </tr>
                <tr></tr>
              </table>

           

            </div>
          </div>
        </body>
      </html>
    `);
}

async function Tasl_LevelCertificateTemplate(data, certficateImg) {
	console.log('certficateImg', certficateImg);

	return (header = `
		<!DOCTYPE html>
        <html>
          <head>
            <title>TASL Certificate</title>
            <style>
              body {
                margin: 0;
                padding: 0;
              }

              .certificate-container {
                position: relative;
                width: 70.19rem; /* 1123px */
                height: 49.63rem; /* 794px */
                background-image: url("${CONFIG.image_host}${certficateImg}");
                background-size: 100% 100%; /* ensures full image shows */
                background-repeat: no-repeat;
                font-family: "Poppins", sans-serif;
              }

              .title {
                position: absolute;
                top: 25rem;
                left: 50%;
                transform: translateX(-50%);
                width: 100%;
                text-align: center;
                font-size: 2rem;
                font-weight: bold;
                color: white;
              }

              .recipient {
                position: absolute;
                top: 30.65rem;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.5rem;
                color: black;
                font-weight: bold;
                text-transform:uppercase;
                width: 80%;
                max-width: 80%;
                text-align: center;
                color: black;
                white-space: normal;
                word-wrap: break-word;
              }

              .course-info {
                position: absolute;
                top: 34rem;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                max-width: 80%;
                text-align: center;
                color: black;
                white-space: normal;
                word-wrap: break-word;
              }

              .course-line1{
                font-size: 1.3rem;
                margin: 0.25rem 0;
              }

              .course-line2 {
                font-size: 1.5rem;
                font-weight: bold;
                margin: 0.25rem 0;
              }


              .footer-row {
                position: absolute;
                bottom: 4rem;
                left: 10.25rem;
                right: 1.25rem;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                flex-wrap: wrap;
              }

              .date {
                font-size: 1rem;
                max-width: 20%;
                word-wrap: break-word;
                flex-shrink: 0;
              }

              .signatures {
                display: flex;
                gap: 4.25rem;
                font-size: 0.75rem;
                flex-wrap: nowrap;
                justify-content: flex-end;
                align-items: flex-end;
              }

              .signatures div {
                text-align: center;
                width: 20rem;
	              max-width: 100%;
	              word-wrap: break-word;
              }

              .signatures img {
                height: 3.125rem;
                object-fit: contain;
              }

              .sig-name {
                margin-top: 0.375rem;
                white-space: normal;
              }

              .sig-role {
                margin-top: 0.125rem;
                white-space: normal;
              }
            </style>
          </head>
          <body>
            <div class="certificate-container">
              <div class="title">
                <font face="Poppins, sans-serif">CERTIFICATE OF COMPLETION</font>
              </div>

              <div class="recipient">
                <font face="Poppins, sans-serif">${data.data.name}</font>
              </div>

              <div class="course-info">
                <div class="course-line1">
                  <font face="Poppins, sans-serif">${data.data.CertificateLine1}</font>
                </div>
                <div class="course-line2">
                  <font face="Poppins, sans-serif"
                    ><strong>${data.data.CertificateLine2}</strong></font
                  >
                </div>
              </div>

              <div class="footer-row">
                <div class="date">
                  <font face="Poppins, sans-serif">
                    <span><strong>Date:</strong></span>
                    <span>${moment(data.data.date).format('MMM DD, YYYY')}</span>
                  </font>
                </div>
                <div class="signatures">
                    ${
											data.data.signaturePath1
												? `
                    <div>
                        <img src="${data.data.signaturePath1}" />
                         <div class="sig-name">
                          <font face="Poppins, sans-serif">${data.data.signatureName1}</font>
                        </div>
                        <div class="sig-role">
                          <font face="Poppins, sans-serif">${data.data.signatureDesignation1}</font>
                        </div>
                    </div>
                    `
												: ''
										}
                      ${
												data.data.signaturePath2
													? `
                    <div>
                        <img src="${data.data.signaturePath2}"  />
                        <div class="sig-name">
                          <font face="Poppins, sans-serif">${data.data.signatureName2}</font>
                        </div>
                        <div class="sig-role">
                          <font face="Poppins, sans-serif">${data.data.signatureDesignation2}</font>
                        </div>
                    </div>
                       `
													: ''
											}
                </div>
              </div>

            </div>
          </body>
        </html>

		`);
}

async function gCertificatepdf(header, name) {
	return new Promise((resolve, reject) => {
		let filename = name;
		generatePDFfromHTML(header, filename)
			.then(() => {
				console.log('PDF generated successfully');
				resolve(filename);
			})
			.catch((err) => console.error('Error generating PDF:', err));
	});
}

async function generatePDFfromHTML(htmlContent, outputPath) {
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	const page = await browser.newPage();
	await page.setContent(htmlContent);
	await page.pdf({ path: outputPath, format: 'A4', printBackground: true, landscape: true });
	await browser.close();
	// console.log('-----------Compliated------------------');
}

const downloadCertification = async function (req, res) {
	try {
		let LearnerAchievementId = req.params.LearnerAchievementId;

		// Get Certification details
		[err, getCertificateData] = await to(
			LearnerAchievement.findOne({
				where: {
					id: LearnerAchievementId,
				},
				attributes: ['id', 'data', 'createdAt', 'UserId', 'filePath'],
				include: [
					{
						model: User,
						attributes: ['id', 'MarketId', 'local_user_id'],
						include: [
							{
								model: Market,
								attributes: ['id', 'db_name'],
							},
						],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		//Need to check that already Certificate Genrated or not
		// If Certificate is Nor Genrated then Genrated Certificate and Save File Name into the DataBase.

		if (getCertificateData.filePath) {
			return res.download(CONFIG.imagePath + getCertificateData.filePath);
		}

		if (getCertificateData?.User?.Market) {
			//Find User Personal data

			[err, localUser] = await to(
				dbInstance[getCertificateData.User.Market.db_name].User_master.findOne({
					where: {
						id: getCertificateData.User.local_user_id,
					},
					attributes: ['first', 'last'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			//Find Learner Branch Details

			[err, learnerBranch] = await to(
				User_role_client_mapping.findOne({
					where: {
						UserId: getCertificateData.UserId,
						RoleId: 1,
						forDiwo: true,
					},
					attributes: ['ClientId'],
				})
			);
			if (err) return ResponseError(res, err, 500, true);

			if (!learnerBranch) {
				/// branch Not Found Error
			}
			// Get AppBranding Color and Logo File
			let appBranding = await getDiwoClientAppBrandingByClientId(learnerBranch.ClientId);

			let learnerName = localUser.first + '_' + localUser.last;

			let fileName = 'uploads/learner_submission/' + learnerName + Date.now() + '.pdf';
			let payload = {
				data: {
					date: getCertificateData.createdAt,
					CertificateLine1: getCertificateData?.data?.CertificateLine1 ? getCertificateData.data.CertificateLine1 : ' ',
					CertificateLine2: getCertificateData?.data?.CertificateLine2 ? getCertificateData.data.CertificateLine2 : ' ',
					CertificateLine3: getCertificateData?.data?.CertificateLine3 ? getCertificateData.data.CertificateLine3 : ' ',
					name: localUser.first + ' ' + localUser.last,
					color: appBranding?.accent_color ? appBranding.accent_color : '#6513e1',
					logoUrl: CONFIG.image_host + appBranding.signature_image_path,
					fileName: CONFIG.imagePath + fileName,

					signatureName1: getCertificateData?.data?.signatureName1 ? getCertificateData.data.signatureName1 : ' ',
					signatureDesignation1: getCertificateData?.data?.signatureDesignation1
						? getCertificateData.data.signatureDesignation1
						: ' ',
					signaturePath1: getCertificateData?.data?.signaturePath1
						? CONFIG.image_host + getCertificateData.data.signaturePath1
						: ' ',

					signatureName2: getCertificateData?.data?.signatureName2 ? getCertificateData.data.signatureName2 : ' ',
					signatureDesignation2: getCertificateData?.data?.signatureDesignation2
						? getCertificateData.data.signatureDesignation2
						: ' ',
					signaturePath2: getCertificateData?.data?.signaturePath2
						? CONFIG.image_host + getCertificateData.data.signaturePath2
						: ' ',
				},
			};

			// console.log('--Certificate-payload------', payload);
			//Need to Save File Name fileName into the DataBase

			await generateLevelCertificate(payload);

			[err, updateCertificationDetails] = await to(
				LearnerAchievement.update(
					{
						filePath: fileName,
					},
					{
						where: {
							id: LearnerAchievementId,
						},
					}
				)
			);
			if (err) return ResponseError(res, err, 500, true);
			return res.download(CONFIG.imagePath + fileName);
		}

		return ResponseSuccess(res, {
			message: 'Something went wrong.',
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.downloadCertification = downloadCertification;

const getAllLearnerCertification = async function (req, res) {
	try {
		let UserId = req.user.id;

		// Get Certification details
		[err, CertificateData] = await to(
			LearnerAchievement.findAll({
				where: {
					UserId: UserId,
				},
				attributes: ['id', 'UserId', 'isBadge', 'isCertificate', 'data', 'filePath'],
				include: [
					{
						model: Badge,
						attributes: ['id', 'title', 'code', 'path'],
					},
				],
			})
		);
		if (err) return ResponseError(res, err, 500, true);

		return ResponseSuccess(res, {
			data: CertificateData,
		});
	} catch (error) {
		return ResponseError(res, error, 500, true);
	}
};
module.exports.getAllLearnerCertification = getAllLearnerCertification;
