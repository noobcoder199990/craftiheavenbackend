var express = require("express");
var jwt = require("jsonwebtoken");
var { body } = require("express-validator");
var bcrypt = require("bcrypt");
const ProductModel = require("../models/ProductModel.js");
var { success, checkError, error } = require("../response.js");
const jwtVerify = require("../jwtVerify.js");
const { default: validator } = require("validator");
var router = express.Router();
const log = require("../logger/index.js");
const fetch = require("node-fetch");
const issuperadmin = require("../superadmincheck.js");
const productModel = require("../models/ProductModel.js");
router.route("/whatsapp").get(async (req, res) => {
  const phoneNumber = req.query.phone;
  const text = req.query.text;

  const url = `https://api.whatsapp.com/send/?phone=918800589429&text=${encodeURIComponent(
    "HELLO jsd;lsdjlzsj"
  )}&type=phone_number&app_absent=0`;

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending message");
  }
});
router
  .route("/create")
  .post(
    issuperadmin,
    [
      body("name")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("name is required ")
        .trim(),
      body("slug")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("slug is required ")
        .trim(),
      body("category_id")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("category_id is required ")
        .trim(),
      body("sub_category_id")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("sub_category_id is required ")
        .trim(),
      body("description")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("description is required ")
        .trim(),
      body("price")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("price is required ")
        .trim(),
      body("stock")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("stock is required ")
        .trim(),
    ],
    checkError,
    async (req, res) => {
      try {
        let {
          name,
          slug,
          category_id,
          sub_category_id,
          description,
          logo,
          price,
          discount_percentage,
          stock,
        } = req.body;
        let product = await ProductModel.findOne({ slug: slug });
        if (product === null) {
          let product = await ProductModel.create({
            slug,
            name,
            category_id,
            sub_category_id,
            description,
            price,
            discount_percentage,
            logo,
            stock,
          });
          return success(res, product, 200);
        } else {
          return error(res, 400, "Product already exists");
        }
      } catch (err) {
        return error(res, err.status, err.message);
      }
    }
  );
router.route("/").get(async (req, res) => {
  try {
    const a = await ProductModel.find({}).populate("logo");
    if (a.length === 0) {
      return error(res, 404, "No content Found");
    }
    return success(res, a, 200);
  } catch (e) {
    return error(res);
  }
});
router.route("/filter").post(async (req, res) => {
  try {
    const { name, slug, category_id, sub_category_id } = req.body;
    let obj = {};
    let arrforor = [];
    if (slug) {
      obj = {};
      obj.slug = { $in: slug.split(",") };
      arrforor.push(obj);
    }
    if (name) {
      obj = {};
      obj.name = { $in: name.split(",") };
      arrforor.push(obj);
    }
    if (category_id) {
      obj = {};
      obj.category_id = { $in: category_id.split(",") };
      arrforor.push(obj);
    }
    if (sub_category_id) {
      obj = {};
      obj.sub_category_id = { $in: sub_category_id.split(",") };
      arrforor.push(obj);
    }
    log.debug(obj);

    const a =
      arrforor.length > 0
        ? await ProductModel.find({ $or: arrforor }).populate("logo")
        : await ProductModel.find().populate("logo");
    if (a.length === 0) {
      return success(res, [], 200);
    }
    return success(res, a, 200);
  } catch (e) {
    log.debug(e.message);
    return error(res);
  }
});
router.route("/:id").patch(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      category_id,
      sub_category_id,
      logo,
      description,
      price,
      discount_percentage,
      stock,
      tags,
      rating,
      user_bought,
      no_of_time_rating_added,
    } = req.body;
    const stu = await productModel.findById(id);
    if (!stu) {
      return error(res, 404, "not found");
    }
    let prevuser = stu?.user_bought ? stu?.user_bought : [];
    prevuser.push(user_bought);
    let prevrating = stu?.sumofrating ? stu?.sumofrating : 0;
    let newrating = stu?.rating;
    let sumofrating = stu?.sumofrating ? stu?.sumofrating : 0;
    let noofrating = stu?.no_of_time_rating_added
      ? stu?.no_of_time_rating_added
      : 0;
    if (rating) {
      let ratingaftermin5 = Math.min(rating, 5);
      sumofrating += ratingaftermin5;
      noofrating++;
      newrating = Math.min(5, sumofrating / noofrating);
    }
    log.info(newrating, sumofrating, prevuser.length, 5 / 1);
    const a = await productModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          slug,
          category_id,
          sub_category_id,
          no_of_time_rating_added: noofrating,
          logo,
          description,
          sumofrating,
          price,
          discount_percentage,
          stock,
          tags,
          rating: newrating,
          user_bought,
        },
      },
      {
        new: true,
      }
    );

    return success(res, a, 202);
  } catch (e) {
    log.error(e);
    return error(res);
  }
});
module.exports = router;
