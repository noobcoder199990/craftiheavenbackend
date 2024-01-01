const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
	path: {
		type: String,
		required: true
	},
	variant_id:{
		type:mongoose.Schema.ObjectId,
		required: true,
		ref:'productVaritation'
	},
	is_featured:{
		type:Boolean
	}
}, {
	timestamps: true
});
let photoModel = mongoose.models?.photo || mongoose.model('photo', photoSchema);
module.exports = photoModel; 