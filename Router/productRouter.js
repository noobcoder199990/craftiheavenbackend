var express = require('express');
var jwt = require('jsonwebtoken');
const multer = require('multer');
var { body } = require('express-validator');
var bcrypt = require('bcrypt');
const ProductModel = require('../models/ProductModel.js')
var { success, checkError, error } = require('../response.js');
const jwtVerify = require('../jwtVerify.js');
const { default: validator } = require('validator');
var router = express.Router();
const saltRounds = 10;
const ACCESS_TOKEN_EXPIRY_IN_MINUTES = process.env.ACCESS_TOKEN_EXPIRY_IN_MINUTES;
const JWT_SECRET = process.env.JWT_SECRET;
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'dhzouknuj',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const log = require('../logger/index.js');
var upload = multer({ dest: './upload/' });
router
    .route('/create')
    .post(jwtVerify,
        [
            body('name')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('name is required ')
                .trim(),
            body('slug')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('slug is required ')
                .trim(),
            body('category_id')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('category_id is required ')
                .trim(),
            body('sub_category_id')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('sub_category_id is required ')
                .trim(),
            body('description')
                .exists({ checkFalsy: true, checkNull: true })
                .withMessage('description is required ')
                .trim(),

        ],
        checkError,upload.single('image'),
        async (req, res) => {
            try {
                let { name, slug, category_id, image } =
                    req.body;
                log.debug(image,req.file);
                cloudinary.uploader.upload(image.thumbUrl, {
                    public_id: "name",
                    tags: 'name'
                }, (err, result) => {
                    if (err) {
                        console.log(err.message);
                        return error(res);
                    } else {
                        console.log(result);
                        return success(res, result, 200);
                    }
                });
                // let product = await ProductModel.findOne({ slug: slug });
                // if (subcategory === null) {

                //     let product = await ProductModel.create({ slug, name, category_id });
                //     log.debug(product);
                //     return success(res, product, 200);
                // }
                // else {
                //     return error(
                //         res,
                //         400,
                //         'Product already exists'
                //     );

                // }
            }
            catch (err) {
                return error(res, err.status, err.message)
            }
        }
    );
router.route('/').get(jwtVerify, async (req, res) => {
    try {
        const a = await ProductModel.find({});
        if (a.length === 0) {
            return error(res, 404, 'No content Found');
        }
        return success(res, a, 200);
    } catch (e) {
        return error(res);
    }
});
module.exports = router;
