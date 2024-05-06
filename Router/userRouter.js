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
const S3 = require("aws-sdk/clients/s3");
const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});
const randomGenerator = () => {
  return Math.random().toString(36).substring(2, 10);
};

async function PublicUploadFile(req, res) {
  const { files, directory, private } = req.body;
  let nameSplit = files.name.split(".");
  const ext = nameSplit[nameSplit.length - 1];
  nameSplit.pop();
  const name = nameSplit.join(".");
  const key = `public/${directory}/${name}-${randomGenerator()}.${ext}`;
  Bucket = !private
    ? process.env.AWS_BUCKET
    : process.env.AWS_PRIVATE_BUCKET_NAME;
  const fileParams = {
    Bucket,
    Key: decodeURIComponent(key),
    ContentType: files.type,
  };
  const ans = await s3
    .getSignedUrlPromise("putObject", fileParams)
    .then((data) => data)
    .catch((err) => {
      return error(res);
    });
  return ans;
}
router.route("/").get(async (req, res) => {
  try {
    const a = await userModel.find({}).lean();
    if (a.length === 0) {
      return error(res, 404, "No content Found");
    }
    let finaluser = {};
    Object.keys(a).map((data) => {
      if (data === "hash") {
        return " ";
      }
      finaluser[`${data}`] = a[data];
    });
    return success(res, finaluser, 200);
  } catch (e) {
    return error(res);
  }
});
router.route("/filter").post(async (req, res, next) => {
  try {
    const { email, phone, loginByOtp } = req.body;
    let user;
    if (email) {
      user = await userModel.findOne({ email: email });
    } else if (phone) {
      user = await userModel.findOne({ phone: phone });
    }
    if (!user) {
      return error(res, 400, "Account does not exist");
    }
    const { first_name, last_name, _id } = user;
    return success(
      res,
      {
        first_name,
        last_name,
        email: user.email,
        _id,
      },
      200
    );
  } catch (err) {
    log.debug(err);
    return error(res);
  }
});
router.route("/login").post(async (req, res, next) => {
  const { email, loginByOtp, phone } = req.body;
  let user;
  if (email) {
    user = await userModel.findOne({ email: email });
  } else if (phone) {
    user = await userModel.findOne({ phone: phone });
  }
  if (!user) {
    return error(res, 400, "Account does not exist");
  }
  let payload = { payload: user?._id };
  let options = {
    expiresIn: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
  };
  const token = jwt.sign(payload, JWT_SECRET, options);
  if (loginByOtp) {
    req.user = user;
    res.cookie("jwt", token, {
      maxAge: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
      httpOnly: false,
      secure: true,
      sameSite: "none",
    });
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
  } else {
    bcrypt.compare(
      req.body.password,
      user.hash,

      async (err, result) => {
        if (err) {
          return error(res, 400, "some error occured");
        }

        if (!result) return error(res, 400, "Incorrect Password");
        req.user = user;
        res.cookie("jwt", token, {
          maxAge: ACCESS_TOKEN_EXPIRY_IN_MINUTES * 3600000,
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
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
});
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

router.route("/getsignedurl").post(async function add(req, res) {
  try {
    const a = await PublicUploadFile(req, res);
    return success(res, a, 201);
  } catch (err) {
    log.error(err);
    return error(res);
  }
});
router
  .route("/:id")
  .get(async (req, res) => {
    try {
      const user = await userModel
        .findById(req.params.id)
        .populate("cart")
        .lean();
      if (user.length === 0) {
        return error(res, 404, "not found");
      }
      let finaluser = {};
      Object.keys(user).map((data) => {
        if (data === "hash") {
          return " ";
        }
        finaluser[`${data}`] = user[data];
      });
      return success(res, finaluser, 200);
    } catch (err) {
      log.error(err);
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
router.route("/:id/cart/order").post(async function add(req, res) {
  try {
    const { id } = req.params;
    const { selectedsingleproduct } = req.body;
    const a = await userModel.findById(id).populate("cart");
    let address = a.shipping_address ? a.shipping_address : a.address;
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
      let ordercreated = await orderModel.create({
        user_id: req.user._id,
        address,
        total_amount_paid: product?.price - discount,
        item: [
          { product: product, amountpaidbycustomer: product?.price - discount },
        ],
        order_id: order.id,
        amount: product?.price - discount,
      });
      return success(
        res,
        { order_id: order?.id, amount: product?.price - discount },
        200
      );
    }

    let cost = 0;
    let orderitem = [];
    for (let product of a.cart) {
      let currentprice = product.price;
      let discount = product?.discount_percentage
        ? (product.price * product?.discount_percentage) / 100
        : 0;
      cost += (currentprice - discount) * 100;
      orderitem.push({
        product: product,
        amountpaidbycustomer: product?.price - discount,
      });
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
      total_amount_paid: cost / 100,
      item: orderitem,
      address,
    });
    return success(res, { order_id: order?.id, amount: cost }, 200);
  } catch (err) {
    log.error(err);
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
        let order = await orderModel.find({ order_id: order_id });
        order = order[0];
        if (order.length) {
          order[0].payment_id = razorpay_payment_id;
          order[0].status = "PAID";
          await order.save;
        }
        inviteUserEmail(["info@craftyheaven.online"], req.user, order);
        return success(res, order, 200);
      } else {
        return error(res, 400, "verification failed");
      }
    } catch (err) {
      log.error(err);
      return error(res);
    }
  });

module.exports = router;
