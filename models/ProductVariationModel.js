const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
	product_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'product',
		required: true
	},
	name: {
		type: String,
		required: true
	},
	specification: {
		type: String,
		required: true
	}
}, {
	timestamps: true
});

let productVariationModel = mongoose.models?.productVaritation || mongoose.model('productVaritation', productVariationSchema);

module.exports = productVariationModel; 