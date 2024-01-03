var express = require('express');
var jwt = require('jsonwebtoken');
var { body } = require('express-validator');
var bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

var { success, checkError, error } = require('../response.js');
const jwtVerify = require('../jwtVerify');
const { default: validator } = require('validator');
var router = express.Router();
const saltRounds = 10;
const ACCESS_TOKEN_EXPIRY_IN_MINUTES = process.env.ACCESS_TOKEN_EXPIRY_IN_MINUTES;
const JWT_SECRET = process.env.JWT_SECRET;
const log = require('../logger');
router
    .route('/create')
    .post(jwtVerify,
        [
            body('email')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('email id is required ')
                .trim()
                .isEmail()
                .withMessage('email id is required ')
                .normalizeEmail(),
            body('password')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('password is required ')
                .trim(),
            body('first_name')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('first_name is required ')
                .trim(),
        ],
        checkError,
        async (req, res) => {
            try {
                let { password, email, last_name, first_name } =
                    req.body;
                try {

                    let user = await userModel.findOne({ email: email });
                    if (user === null) {
                        try {
                            let orgname = '';
                             let hash;
                                bcrypt.hash(password, saltRounds, async (err, hash) => {
                                    if (err) {
                                        log.error(err);
                                        return error(res, 500, 'Some internal error occurred');
                                    }

                                    hash = hash;
                                    log.debug(hash)
                                    const curruser = await userModel.create({
                                        email,
                                        first_name,
                                        last_name,
                                        hash
                                    });
                                    if (curruser) {
                                        return success(res, curruser, 201);
                                    }
                                });
                        } 
                        catch (err) {
                            return error(res);
                        }

                    }
                    else {
                        log.debug(user, 'dk');
                        return error(
                            res,
                            400,
                            'An account with this email address already exists'
                        );
                    }
                } catch (err) {
                    return error(res, err.status, err.message)
                }
            }
            catch (err) {
                return error(res, err.status, err.message)
            }
        }
    );
router.route('/').get(jwtVerify, async (req, res) => {
    try {
        const a = await userModel.find({});
        if (a.length === 0) {
            return error(res, 404, 'No content Found');
        }
        return success(res, a, 200);
    } catch (e) {
        return error(res);
    }
});

router.route('/:id')
    .delete(jwtVerify, async (req, res) => {
        try {
            const user = await userModel.find({ _id: req.params.id });
            if (user.length === 0) {
                return error(res, 404, 'not found');
            }
            await userModel.deleteOne({ _id: req.params.id });
            return success(res, 'Successfully Deleted', 200);
        } catch (err) {
            return error(res);
        }
    })
    .patch(jwtVerify, async (req, res) => {
        try {
            const { id } = req.params;
            const stu = await userModel.find({
                _id: id,
            });
            if (stu.length === 0) {
                return error(res, 404, 'not found');
            }
            const a = await userModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        ...req.body,
                    },
                },
                {
                    new: true,
                }
            );

            return success(res, a, 202);
        } catch (e) {
            return error(res);
        }
    });

router
    .route('/login')
    .post(
        [
            body('email')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('email id is required for register')
                .trim()
                .isEmail()
                .withMessage('email id is required for register')
                .normalizeEmail(),
            body('password')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('password is required for login'),
        ],
        checkError,
        async (req, res, next) => {
            const { email } = req.body;
            const user = await userModel.findOne({ email: email });
            if (!user) {
                return error(res, 400, 'Account does not exist');
            }
            let payload = { payload: user._id };
            let options = {
                expiresIn: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
            };
            log.debug(246);
            const token = jwt.sign(payload, JWT_SECRET, options);
            log.debug(252);

            bcrypt.compare(
                req.body.password,
                user.hash,

                async (err, result) => {
                    if (err) {
                        return error(res, 400, 'some error occured');
                    }

                    if (!result) return error(res, 400, 'Incorrect Password');
                    res.cookie('jwt', token, {
                        maxAge: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
                        httpOnly: false,
                        secure: JSON.parse(false),
                    });
                    log.debug(259);
                    const {
                        first_name,
                        last_name,
                        email
                    } = user;
                    return success(
                        res,
                        {
                            first_name,
                            last_name,
                            email,
                        },
                        200
                    );
                }
            );
        }
    );

module.exports = router;
