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
    .post(
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
        checkError, 
        async (req, res) => {
            try {
                let { name, slug, category_id, sub_category_id, description,logo,price,discount_percentage } =
                    req.body;
                let product = await ProductModel.findOne({ slug: slug });
             log.debug('Ss')
                if (product === null) {

                    let product = await ProductModel.create({ slug, name, category_id, sub_category_id, description,price,discount_percentage,logo });
                    log.debug(product);
                    return success(res, product, 200);
                }
                else {
                    return error(
                        res,
                        400,
                        'Product already exists'
                    );
                }
            }
            catch (err) {
                return error(res, err.status, err.message)
            }
        }
    );
router.route('/').get( async (req, res) => {
    try {
        const a = await ProductModel.find({}).populate('logo');
        if (a.length === 0) {
            return error(res, 404, 'No content Found');
        }
        return success(res, a, 200);
    } catch (e) {
        return error(res);
    }
});
router.route('/filter').post( async (req, res) => {
    try {
        const { name, slug, category_id, sub_category_id } = req.body;
        let obj = {}
        if (slug) {
            obj.slug = {$in: slug.split(',')};
        }
        if (category_id) {
            obj.category_id = {$in: category_id.split(',')};
        }
         if (sub_category_id) {
           obj.sub_category_id = { $in: sub_category_id.split(',') };
        }
        log.debug(obj)
        const a = await ProductModel.find(obj).populate('logo');
        if (a.length === 0) {
            return success(res, [],200);
        }
        return success(res, a, 200);
    } catch (e) {
        return error(res);
    }
});
module.exports = router;
