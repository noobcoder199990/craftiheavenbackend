const mongoose = require("mongoose");
const paymentStatus = require("../ENUMS/paymentStatus");
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
    status: {
      type: String,
      enum: [PAYMENT_PENDING, PAID, PAYMENT_FAILED],
      default: "PAYMENT_PENDING",
    },
  },
  { timestamps: true }
);

const orderModel =
  mongoose.models?.orderSchema || mongoose.model("orderSchema", orderSchema);

module.exports = orderModel;
