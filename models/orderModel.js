const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    order_id: {
      type: String,
    },
    payment_id: {
      type: String,
    },
    amount: {
      type: Number,
    },
    address: {
      state: {
        type: String,
      },
      Country: {
        type: String,
      },
      street: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ["PAYMENT_PENDING", "PAID", "PAYMENT_FAILED"],
      default: "PAYMENT_PENDING",
    },
  },
  { timestamps: true }
);

const orderModel =
  mongoose.models?.orderSchema || mongoose.model("orderSchema", orderSchema);

module.exports = orderModel;
