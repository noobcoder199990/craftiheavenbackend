var express = require("express");
var jwt = require("jsonwebtoken");
var { body } = require("express-validator");
var bcrypt = require("bcrypt");
const categoryModel = require("../models/CategoryModel");

var { success, checkError, error } = require("../response.js");
const jwtVerify = require("../jwtVerify");
const { default: validator } = require("validator");
var router = express.Router();
const saltRounds = 10;
const ACCESS_TOKEN_EXPIRY_IN_MINUTES =
  process.env.ACCESS_TOKEN_EXPIRY_IN_MINUTES;
const JWT_SECRET = process.env.JWT_SECRET;
const log = require("../logger");
router
  .route("/create")
  .post(
    [
      body("name")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("name is required ")
        .trim(),
      body("slug")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("slug is required ")
        .trim(),
    ],
    checkError,
    async (req, res) => {
      try {
        let { name, slug } = req.body;

        let category = await categoryModel.findOne({ slug: slug });
        if (category === null) {
          let category = await categoryModel.create({ slug, name });
          return success(res, category, 200);
        } else {
          return error(res, 400, "Category already exists");
        }
      } catch (err) {
        return error(res, err.status, err.message);
      }
    }
  );
router.route("/").get(async (req, res) => {
  try {
    const a = await categoryModel.find({});
    if (a.length === 0) {
      return error(res, 404, "No content Found");
    }
    return success(res, a, 200);
  } catch (e) {
    return error(res);
  }
});

router
  .route("/:id")
  .delete(async (req, res) => {
    try {
      const user = await userModel.find({ _id: req.params.id });
      if (user.length === 0) {
        return error(res, 404, "not found");
      }
      await userModel.deleteOne({ _id: req.params.id });
      return success(res, "Successfully Deleted", 200);
    } catch (err) {
      return error(res);
    }
  })
  .patch(async (req, res) => {
    try {
      const { id } = req.params;
      const stu = await userModel.find({
        _id: id,
      });
      if (stu.length === 0) {
        return error(res, 404, "not found");
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

module.exports = router;
