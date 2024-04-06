const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
    },
    phone: {
      country: {
        type: Number,
      },
      phone_no: {
        type: Number,
      },
    },
    cart: [{ type: mongoose.Schema.ObjectId, ref: "product" }],
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      state: {
        type: String,
      },
      country: {
        type: String,
      },
      street: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },
    hash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

let userModel = mongoose.models?.user || mongoose.model("user", userSchema);

module.exports = userModel;
