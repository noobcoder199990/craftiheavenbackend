const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	slug:{
		type:String,
		required: true,
		unique: true
	},
	categoryId:{
		type:mongoose.Schema.ObjectId,
		ref: "category",
		required:true
	}
}, {
	timestamps: true
});

let subCategoryModel = mongoose.models?.subCategory || mongoose.model('subCategory', subCategorySchema);

module.exports = subCategoryModel;