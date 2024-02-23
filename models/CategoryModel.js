const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},  
	slug:{
		type:String,
		required: true,
		unique: true
	},
}, {
	timestamps: true
});
 
let categoryModel = mongoose.models?.category || mongoose.model('category', categorySchema);
module.exports = categoryModel;
