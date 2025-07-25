const { Strategy } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Market, Op, Child_session } = require('../models1/connectionPool')['global'];
const { to, ResponseError } = require('../services/util.service');
const MESSAGE = require('./../config/message');
let env = process.env.API_APP || 'development';
const CONFIG = require('../config/config')[env];

const getTokenisedUrl = function() {
    return async function(req, res, next) {
        let params = req.params['0'];
        let file = params;
        let user = req.user;
        let isAuthorised = false;
        let expiration_time = parseInt(60 * 60); // 60 minutes expiration for the content JWT

        try {
            if (['Global Super Admin', 'Super Admin', 'Content Tester', 'Content Admin'].includes(req.headers.role)) {
                isAuthorised = true;
            } else if (file.includes('/Content1/')) {
                //isAuthorised = await checkTutorialAccess(user.id, file);
                isAuthorised = true;
                expiration_time = parseInt(15 * 60); // 15 minutes token for videos
            } else {
                let is_Premium = true;
                let primaryChild;
                let user_ID = user.id;
                [err, user] = await to(User.findById(user.id));
                if (err) return ResponseError(res, err, 500, true);
                if (user.type != "Normal User") {
                    user_ID = user.associated_acc;
                    [err, user] = await to(User.findById(user_ID));
                    if (err) return ResponseError(res, err, 500, true);

                }
                [err, children] = await to(user.getChildren({ where: { active: true, account_id: user_ID + '', [Op.and]: [sequelize.where(sequelize.col('user_child_mappings.is_default'), true)] }, include: [{ model: Market }] }));
                if (err) return ResponseError(res, err, 500, true);
                if (children.length < 1)
                    is_Premium = false;

                primaryChild = children[0];

                if (is_Premium) {
                    if (primaryChild.PackageId == undefined || primaryChild.PackageId == null) {
                        is_Premium = false;
                    }
                }

                if (is_Premium) {
                    isAuthorised = await checkFileAccess(user.id, file);
                } else {
                    isAuthorised = await checkFreeContentFileAccess(user.id, file);
                }
            }
            if (isAuthorised) {
                let token = jwt.sign({ user_id: user.id, filename: 'content' }, CONFIG.jwt_encryption, { expiresIn: expiration_time });
                res.locals.file = encodeURI(file);
                file = encodeURI(file) + '?token=' + token;
                res.locals.token = token;
                res.locals.path = file;
                res.locals.req_file_token = token;
                return next();
            }
        } catch (error) {
            return ResponseError(res, error, 500, true);
        }
        return ResponseError(res, { message: MESSAGE.UNAUTHORISED }, 403);
    }
}


const getPayload = function(passport) {
    let opts = {};
    opts.jwtFromRequest = (req) => req.query.token;
    opts.secretOrKey = CONFIG.jwt_encryption;
    opts.ignoreExpiration = false;
    passport.use('content', new Strategy(opts, async function(jwt_payload, done) {
        let user_id = jwt_payload.user_id;
        let path = jwt_payload.filename;
        if (user_id && path) {
            done(null, { user_id, path });
        } else if (jwt_payload.type == 'demo') {
            done(null, { type: 'demo' })
        } else {
            done(null, false);
        }
    }));
}

const authoriseToken = function(passport_) {
    return function(req, res, next) {
        passport_.authenticate('content', { session: false }, async function(err, data, info) {
            if (info && info.name == 'TokenExpiredError') {
                return ResponseError(res, { message: MESSAGE.TOKEN_EXPIRED }, 403);
            }

            if (data && data.user_id && data.path) {
                try {
                    if (data.path == 'content') {
                        return next();
                    }
                    return ResponseError(res, err, 403, true);
                } catch (error) {
                    return ResponseError(res, error, 500, true);
                }
            } else if (data.type == 'demo' && !data.path) {
                return next();
            }
            return ResponseError(res, { message: MESSAGE.UNAUTHORISED }, 403);
        })(req, res, next)
    }
}

module.exports = { getTokenisedUrl, getPayload, authoriseToken };

const checkFileAccess = async function(userId, filepath) {
    let file = filepath.split('/').pop();
    if (file) {
        return sequelize.query(`SELECT EXISTS (SELECT "Child_content_details".id FROM  "Activity_content_details"
                INNER JOIN "Child_content_details" ON "Activity_content_details"."ActivityContentId" = "Child_content_details"."ActivityContentId"
                INNER JOIN "Child_session_activities" ON "Child_content_details"."ChildSessionActivityId" = "Child_session_activities".id
                INNER JOIN "Child_sessions" ON "Child_session_activities"."ChildSessionId" = "Child_sessions".id
                INNER JOIN "Children" ON "Child_sessions"."ChildId" = "Children".id
                INNER JOIN user_child_mappings ucm on "Children".id = ucm."ChildId" and "UserId" = ${userId}
                WHERE "Activity_content_details"."name" = '${file}')`)
            .then((result) => {
                if (result[0][0].exists)
                    return true;
                else
                    return false;
            })
    }
    return Promise.resolve(false);
}

const checkFreeContentFileAccess = async function(userId, filepath) {
    let file = filepath.split('/').pop();
    if (file) {
        return sequelize.query(`SELECT EXISTS (SELECT "Free_Child_content_details".id FROM  "Activity_content_details"
                INNER JOIN "Free_Child_content_details" ON "Activity_content_details"."ActivityContentId" = "Free_Child_content_details"."ActivityContentId"
                INNER JOIN "Free_Child_session_activities" ON "Free_Child_content_details"."FreeChildSessionActivityId" = "Free_Child_session_activities".id
                INNER JOIN "Child_sessions" ON "Free_Child_session_activities"."ChildSessionId" = "Child_sessions".id
                INNER JOIN "Children" ON "Child_sessions"."ChildId" = "Children".id
                INNER JOIN user_child_mappings ucm on "Children".id = ucm."ChildId" and "UserId" = ${userId}
                WHERE "Activity_content_details"."name" = '${file}')`)
            .then((result) => {
                if (result[0][0].exists)
                    return true;
                else
                    return false;
            })
    }
    return Promise.resolve(false);
}

const checkTutorialAccess = async function(userId, path) {
    return sequelize.query(`SELECT count(*) FROM  "User_package_lists" where "UserId" = (SELECT associated_acc FROM "Users" WHERE id = ${userId}) AND is_purchased = true;`)
        .then((result) => {
            if ((result[0][0].count) > 0)
                return true;
            else
                return false;
        })
}