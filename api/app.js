const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const pe = require('parse-error');
const cors = require('cors');
const path = require('path');
const v1 = require('./routes/v1');
const contents = require('./routes/contents');
const app = express();
let env = process.env.API_APP || 'development';
const CONFIG = require('./config/config')[env];
const useragent = require('express-useragent');

const securityMiddleware = require('./middleware/securityMiddleware.js');

//app.use(logger('combined'));
app.use(useragent.express());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
// app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use('/public', express.static(__dirname + '/public'));
const { to, ResponseError, ResponseSuccess } = require('./services/util.service');


// app.use('/scorm-launch', express.static(path.join(__dirname, `${CONFIG.imagePath}` + 'uploads/scorm_modules')));     


// const models = require("./models");
const DBModel = require('./models1/connectionPool.js');

const models = Object.keys(DBModel);
models.forEach((element) => {
	DBModel[element].sequelize
		.authenticate()
		.then(() => {
			console.log('Connected to SQL database:', element);
			if (CONFIG.dbAlter === true) {
				DBModel[element].sequelize.sync({ alter: true }).then(() => {
					console.log('Db Alter command completed');
				});
			}
		})
		.catch((err) => {
			console.error('Unable to connect to SQL database:', element, err);
		});
});

app.use(
	cors({
		credentials: true,
		origin: [
			`${CONFIG.drip_host}`,
			`${CONFIG.diwo_host}`,
			`${CONFIG.drip_web_host}`,
			`${CONFIG.diwo_web_host}`,
			`http://localhost:8101`,
		],
		optionsSuccessStatus: 200,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	})
);

app.use(securityMiddleware);

app.use('/contents', contents);
app.use('/v1', v1);

app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});
app.use('/', function (req, res) {
	res.statusCode = 200;
	res.json({ status: 'success', message: 'Success', data: {} });
});

app.use(function (err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.status(err.status || 500).send({ err });
});

module.exports = app;
process.on('unhandledRejection', (error) => {
	console.error('Uncaught Error', pe(error));
});
