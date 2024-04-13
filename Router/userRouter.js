var express = require("express");
const log = require("../logger");
var jwt = require("jsonwebtoken");
var { body } = require("express-validator");
var bcrypt = require("bcrypt");
const userModel = require("../models/UserModel");
const productModel = require("../models/ProductModel.js");
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
log.debug(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
var { success, checkError, error } = require("../response.js");
const jwtVerify = require("../jwtVerify");
const { default: validator } = require("validator");
var router = express.Router();
const saltRounds = 10;
const ACCESS_TOKEN_EXPIRY_IN_MINUTES =
  process.env.ACCESS_TOKEN_EXPIRY_IN_MINUTES;
const JWT_SECRET = process.env.JWT_SECRET;
var crypto = require("crypto");
const inviteUserEmail = require("../emailservice/paymentemail.js");
const orderModel = require("../models/orderModel.js");
router
  .route("/create")
  .post(
    [
      body("email")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("email id is required ")
        .trim()
        .isEmail()
        .withMessage("email id is required ")
        .normalizeEmail(),
      body("address.country")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("country is required ")
        .trim(),
      body("address.state")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("state is required ")
        .trim(),
      body("address.street")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("street is required ")
        .trim(),
      body("address.pincode")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("pincode is required ")
        .trim(),
      body("password")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("password is required ")
        .trim(),
      body("first_name")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("first_name is required ")
        .trim(),
    ],
    checkError,
    async (req, res) => {
      try {
        let { password, email, last_name, first_name, address } = req.body;
        try {
          let user = await userModel.findOne({ email: email });
          if (user === null) {
            try {
              let orgname = "";
              let hash;
              bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                  log.error(err);
                  return error(res, 500, "Some internal error occurred");
                }

                hash = hash;
                log.debug(address);
                const curruser = await userModel.create({
                  email,
                  first_name,
                  last_name,
                  hash,
                  ...req.body,
                });
                if (curruser) {
                  return success(res, curruser, 201);
                }
              });
            } catch (err) {
              return error(res);
            }
          } else {
            log.debug(user, "dk");
            return error(
              res,
              400,
              "An account with this email address already exists"
            );
          }
        } catch (err) {
          return error(res, err.status, err.message);
        }
      } catch (err) {
        return error(res, err.status, err.message);
      }
    }
  );
router.route("/").get(async (req, res) => {
  try {
    const a = await userModel.find({});
    if (a.length === 0) {
      return error(res, 404, "No content Found");
    }
    return success(res, a, 200);
  } catch (e) {
    return error(res);
  }
});
router.route("/:id/cart/order").post(async function add(req, res) {
  try {
    log.debug(req.user && req.user._id);
    const { id } = req.params;
    const { selectedsingleproduct } = req.body;
    if (selectedsingleproduct) {
      const product = await productModel.findById(selectedsingleproduct);
      let discount = product?.discount_percentage
        ? (product.price * product?.discount_percentage) / 100
        : 0;
      let order = await instance.orders.create({
        amount: (product?.price - discount) * 100,
        currency: "INR",
        receipt: id,
      });
      log.debug(order);
      return success(res, { order_id: order?.id, amount: product?.price }, 200);
    }
    const a = await userModel.findById(id).populate("cart");
    let cost = 0;
    for (let product of a.cart) {
      let currentprice = product.price;
      let discount = product?.discount_percentage
        ? (product.price * product?.discount_percentage) / 100
        : 0;
      log.debug(currentprice, discount);
      cost += (currentprice - discount) * 100;
      log.debug(currentprice, discount);
    }
    cost = Math.max(cost, 100);
    let order = await instance.orders.create({
      amount: cost,
      currency: "INR",
      receipt: id,
    });
    let ordercreated = await orderModel.create({
      user_id: req.user._id,
      order_id: order.id,
      amount: cost / 100,
    });
    log.debug(ordercreated);
    return success(res, { order_id: order?.id, amount: cost }, 200);
  } catch (err) {
    log.debug(err);
    return error(res);
  }
});
router
  .route("/:id/cart/verifypayment")
  .post(jwtVerify, async function addOrder(req, res) {
    try {
      const { id } = req.params;
      const user = await userModel.findById(id).populate("cart");
      const { razorpay_payment_id, order_id, razorpay_signature } = req.body;
      let generated_signature = crypto
        .createHmac("SHA256", process.env.RAZORPAY_KEY_SECRET)
        .update(order_id + "|" + razorpay_payment_id)
        .digest("Hex");
      if (generated_signature === razorpay_signature) {
        let ordercreated = await orderModel.updateOne(
          { user_id: req.user._id },
          {
            payment_id: razorpay_payment_id,
            status: "PAID",
          }
        );
        inviteUserEmail(
          ["varghese.va@hotmail.com,shijinvargheselj1998@gmail.com"],
          req.user,
          ordercreated
        );
        return success(res, "Success", 200);
      } else {
        return error(res, 400, "verification failed");
      }
    } catch (err) {
      log.debug(err);
      return error(res);
    }
  });
router
  .route("/:id")
  .get(async (req, res) => {
    try {
      const user = await userModel.findById(req.params.id).populate("cart");
      if (user.length === 0) {
        return error(res, 404, "not found");
      }
      log.debug(user);
      return success(res, user, 200);
    } catch (err) {
      return error(res);
    }
  })
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
      log.debug(req.body);
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
  .route("/login")
  .post(
    [
      body("email")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("email id is required for register")
        .trim()
        .isEmail()
        .withMessage("email id is required for register")
        .normalizeEmail(),
      body("password")
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage("password is required for login"),
    ],
    checkError,
    async (req, res, next) => {
      const { email } = req.body;
      const user = await userModel.findOne({ email: email });
      if (!user) {
        return error(res, 400, "Account does not exist");
      }
      let payload = { payload: user._id };
      let options = {
        expiresIn: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
      };
      log.debug(payload, JWT_SECRET, options);
      const token = jwt.sign(payload, JWT_SECRET, options);
      log.debug(token);

      bcrypt.compare(
        req.body.password,
        user.hash,

        async (err, result) => {
          if (err) {
            return error(res, 400, "some error occured");
          }

          if (!result) return error(res, 400, "Incorrect Password");
          req.user = user;
          log.debug(token);
          res.cookie("jwt", token, {
            maxAge: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
            httpOnly: false,
            secure: JSON.parse(true),
          });
          log.debug(259);
          const { first_name, last_name, email, _id } = user;
          return success(
            res,
            {
              first_name,
              last_name,
              email,
              _id,
            },
            200
          );
        }
      );
    }
  );

module.exports = router;
