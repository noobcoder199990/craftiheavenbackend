var express = require("express");
var jwt = require("jsonwebtoken");
var { body } = require("express-validator");
var bcrypt = require("bcrypt");
const RatingModel = require("../models/RatingModel.js");
var { success, checkError, error } = require("../response.js");
const jwtVerify = require("../jwtVerify.js");
const { default: validator } = require("validator");
var router = express.Router();
const log = require("../logger/index.js");
router.route("/").get(async (req, res) => {
  try {
    let review = await RatingModel.find()
      .populate("images")
      .populate("user_id");
    return success(res, review, 200);
  } catch (err) {
    return error(res, err.status, err.message);
  }
});
router
  .route("/create")
  .post(
    [
      body("rating")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("rating is required ")
        .trim(),
      body("comment")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("comment is required ")
        .trim(),
      body("product_id")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("product_id is required")
        .trim(),
      body("user_id")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("user_id is required ")
        .trim(),
    ],
    checkError,
    async (req, res) => {
      try {
        let { rating, product_id, comment, user_id, images } = req.body;
        let review = await RatingModel.create({
          rating,
          product_id,
          comment,
          user_id,
          images,
        });
        return success(res, review, 200);
      } catch (err) {
        return error(res, err.status, err.message);
      }
    }
  );
router.route("/:id").patch(async (req, res) => {
  try {
    let { rating, comment, images } = req.body;
    let id = req.params();

    let review = await RatingModel.findOneAndUpdate(id, {
      rating,
      comment,
      images,
    });
    return success(res, review, 200);
  } catch (err) {
    return error(res, err.status, err.message);
  }
});
router.route("/filter").post(async (req, res) => {
  try {
    let review = await RatingModel.find(req.body)
      .populate("images")
      .populate("user_id");
    return success(res, review, 200);
  } catch (err) {
    return error(res, err.status, err.message);
  }
});
module.exports = router;
