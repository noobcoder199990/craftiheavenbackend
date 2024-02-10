const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.ObjectId,
      ref: "products",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: true,
    },
    images: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "photo",
      },
    ],
  },
  {
    timestamps: true,
  }
);

let subCategoryModel =
  mongoose.models?.rating || mongoose.model("rating", RatingSchema);

module.exports = subCategoryModel;
