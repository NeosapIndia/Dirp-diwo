const fs = require('graceful-fs');
const express = require('express');
const router = express.Router();
let env = process.env.API_APP || 'development'
const CONFIG = require('../config/config')[env];
const { to, ResponseError, ResponseSuccess } = require('../services/util.service');
const roleAuthorization = require('./../middleware/roleAuth');
const { getTokenisedUrl, getPayload, authoriseToken } = require('./../middleware/contentAuth');
const MESSAGE = require('../config/message');


const sendUrlResponse = (req, res) => {
    return ResponseSuccess(res, { filepath: res.locals.path, req_file_token: res.locals.token ? res.locals.token : null });
};

const sendRequestedFile = (req, res) => {
    try {
        let params = req.params['0'];
        let file = params;
        let language = "";
        if (file.includes("bablr")) {
            let url = file.split(":");
            file = url[1];
            language = url[0];
        }
        let ext = file.split('.').pop();
        let mime = {
            gif: 'image/gif',
            jpg: 'image/jpeg',
            png: 'image/png',
            wav: 'audio/wav',
            mp3: 'audio/mpeg',
            pdf: 'application/pdf',
            mp4: 'video/mp4'
        };

        if (language != "") {
            if (language == "English") {
                let fileUrl = CONFIG.content_path + "english_india/" + file;
                if (fs.existsSync(fileUrl)) {
                    file = fileUrl;
                } else {
                    file = CONFIG.content_path + "english_common/" + file;
                }
            } else if (language == "English(US)") {
                let fileUrl = CONFIG.content_path + "english_usa/" + file;
                if (fs.existsSync(fileUrl)) {
                    file = fileUrl;
                } else {
                    fileUrl = CONFIG.content_path + "english_gb/" + file;
                    if (fs.existsSync(fileUrl)) {
                        file = fileUrl;
                    } else {
                        file = CONFIG.content_path + "english_common/" + file;
                    }
                }
            } else if (language == "English(UK)") {
                let fileUrl = CONFIG.content_path + "english_gb/" + file;
                if (fs.existsSync(fileUrl)) {
                    file = fileUrl;
                } else {
                    file = CONFIG.content_path + "english_common/" + file;
                }
            } else {
                file = CONFIG.content_path + "english_common/" + file;
            }
        } else {
            file = CONFIG.content_path + file;
        }

        let type = mime[ext] || 'text/plain';
        const stat = fs.statSync(file);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            let chunkSize = 1000000;
            const end = parts[1] ? parseInt(parts[1], 10) : (chunkSize < (fileSize - start) ? (start + chunkSize) : (fileSize - 1));
            const chunksize = (end - start) + 1;
            const stream = fs.createReadStream(file, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': type,
            };
            res.writeHead(206, head);
            stream.pipe(res);
            res.on('close', function() {
                stream.destroy();
            });
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': type,
            };
            res.writeHead(200, head);
            let stream = fs.createReadStream(file);
            stream.pipe(res);
            res.on('close', function() {
                stream.destroy();
            });
        }
    } catch (error) {
        console.log('error', error);
        res.status(500).send({ success: false, message: "Caught error", error: error });
    }
}



/* JWT authentication and authorization for User token */
const passport = require('passport');
require('./../middleware/passport')(passport);

router.get('/', function(req, res) {
    res.json({ status: "success", message: "Success", data: { "message": "Version 1.0.0" } })
});

router.get('/files/*', passport.authenticate('jwt', { session: false }), roleAuthorization(['Global Super Admin', 'Global Admin', 'Admin', 'Customer', 'Care Giver', 'Super Admin', 'Content Tester', 'Content Admin']), getTokenisedUrl(), sendUrlResponse);


/* JWT authentication and authorization for content token */
const passport_ = require('passport');
getPayload(passport_);

/* To fetch files with Token in Query */
router.get('/*', authoriseToken(passport_), sendRequestedFile);

module.exports = router;