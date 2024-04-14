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
    total_amount_paid: {
      type: Number,
      required: true,
    },
    item: [
      {
        product: {
          name: {
            type: String,
            required: true,
          },
          slug: {
            type: String,
            required: true,
          },
          category_id: {
            type: mongoose.Schema.ObjectId,
            required: true,
            ref: "category",
          },
          sub_category_id: {
            type: mongoose.Schema.ObjectId,
            required: true,
            ref: "subCategory",
          },
          description: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          discount_percentage: {
            type: Number,
          },
          stock: {
            type: Number,
            required: true,
          },
          tags: [
            {
              type: "String",
            },
          ],
        },
        amountpaidbycustomer: {
          type: Number,
          required: true,
        },
      },
    ],
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
