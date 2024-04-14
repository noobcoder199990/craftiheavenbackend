const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
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
    logo: {
      type: mongoose.Schema.ObjectId,

      ref: "photo",
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
    rating: {
      type: Number,
      max: 5,
    },
    sumofrating: {
      type: Number,
    },
    no_of_time_rating_added: {
      type: Number,
    },
    user_bought: [
      {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
  }
);
let productModel =
  mongoose.models?.product || mongoose.model("product", productSchema);
module.exports = productModel;
