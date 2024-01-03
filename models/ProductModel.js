const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	slug:{
		type:String,
		required: true,
		unique: true
	},
	category_id:{
		type:mongoose.Schema.ObjectId,
		required: true,
		ref:'category'
	},
	sub_category_id:{
		type:mongoose.Schema.ObjectId,
		required: true,
		ref:'subCategory'
	},
	description:{
		type: String,
		required: true
	},
}, {
	timestamps: true
}); 
let productModel = mongoose.models?.product || mongoose.model('product', productSchema);
module.exports = productModel; 